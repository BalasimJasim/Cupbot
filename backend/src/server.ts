import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import bot from './config/bot';
import setupBot from './bot';
import apiRoutes from './routes/api';
import { TelegramError } from 'telegraf';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const webhookPath = '/webhook/' + process.env.TELEGRAM_BOT_TOKEN;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'], // Allow both Next.js default port and your current frontend port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Telegram Bot API is running' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Function to kill process using a port
const killProcessOnPort = async (port: number): Promise<void> => {
  if (process.platform === 'win32') {
    try {
      await new Promise((resolve, reject) => {
        const exec = require('child_process').exec;
        exec(`netstat -ano | findstr :${port}`, (error: any, stdout: string, stderr: string) => {
          if (error || stderr) {
            console.log('No process found on port', port);
            resolve(null);
            return;
          }
          
          const lines = stdout.split('\n');
          const processIds = new Set<string>();
          
          lines.forEach(line => {
            const match = line.match(/\s+(\d+)\s*$/);
            if (match) {
              processIds.add(match[1]);
            }
          });
          
          processIds.forEach(pid => {
            try {
              process.kill(Number(pid));
              console.log(`Killed process ${pid} on port ${port}`);
            } catch (err) {
              console.log(`Failed to kill process ${pid}:`, err);
            }
          });
          
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error killing process:', error);
    }
  }
};

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connection successful');

    // Kill any existing process on the port
    await killProcessOnPort(port);

    // Create HTTP server
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log('Server startup complete! Ready to handle requests.');
    });

    // Handle server errors
    server.on('error', async (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use. Attempting to free it...`);
        await killProcessOnPort(port);
        server.listen(port);
      } else {
        console.error('Server error:', error);
      }
    });

    // Setup and start Telegram bot
    try {
      await setupBot(bot);
      
      if (process.env.NODE_ENV === 'production') {
        const webhookUrl = process.env.APP_URL + webhookPath;
        await bot.telegram.setWebhook(webhookUrl);
        console.log('Webhook set to:', webhookUrl);
        
        app.post(webhookPath, (req, res) => {
          bot.handleUpdate(req.body, res);
        });
      } else {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await bot.launch();
        console.log('Bot started in polling mode');
      }
      console.log('Bot setup completed successfully');
    } catch (error) {
      if (error instanceof TelegramError) {
        console.warn('Warning: Telegram bot failed to start:', error.message);
        if (error.message.includes('terminated by other getUpdates request')) {
          console.log('Attempting to stop other bot instances...');
          try {
            await bot.telegram.deleteWebhook({ drop_pending_updates: true });
            await bot.launch();
            console.log('Bot restarted successfully');
          } catch (retryError) {
            console.error('Failed to restart bot:', retryError);
          }
        }
      } else {
        console.error('Error setting up Telegram bot:', error);
      }
    }

    // Enable graceful stop
    const cleanup = () => {
      server.close(() => {
        console.log('Server closed');
        bot.stop('SIGTERM');
        process.exit(0);
      });
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      cleanup();
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 