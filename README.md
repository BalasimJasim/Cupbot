# Telegram Business Bot Platform

## Overview
This is a versatile Telegram bot platform designed for local businesses to automate customer interactions. The bot can handle customer inquiries, appointment bookings, orders, and FAQs. Each business can have its own customized instance of the bot with specific settings and services.

## Features
- 🤖 Automated customer service
- 📅 Appointment booking system
- 🛍️ Order processing
- ❓ FAQ handling
- 💼 Business profile management
- 📊 Customer interaction tracking
- ⚙️ Customizable settings

## Tech Stack
- Frontend: Next.js (React, TailwindCSS, TypeScript)
- Backend: Node.js (Express, TypeScript)
- Database: MongoDB
- Bot Framework: Telegram Bot API (Telegraf.js)

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Telegram Bot Token (from @BotFather)
- npm or yarn package manager

## Setup Instructions

### 1. Create a Telegram Bot
1. Open Telegram and search for @BotFather
2. Send /newbot command
3. Follow the prompts to create a new bot
4. Save the API token provided

### 2. MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Set up database access (create a user)
4. Configure network access (IP whitelist)
5. Get your connection string

### 3. Environment Configuration
Create a .env file in the backend directory with the following:
\`\`\`
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
\`\`\`

### 4. Installation
\`\`\`bash
# Clone the repository
git clone [repository-url]

# Install backend dependencies
cd backend
npm install

# Initialize the database with your business
npm run init-db

# Start the development server
npm run dev
\`\`\`

## Business Configuration

### Customizing for Your Business
1. Create a new business configuration file:
   \`backend/src/config/business-config.json\`

2. Include your business details:
\`\`\`json
{
  "name": "Your Business Name",
  "description": "Your business description",
  "services": [
    {
      "name": "Service 1",
      "description": "Service description",
      "price": 50,
      "duration": 60
    }
  ],
  "workingHours": [
    {
      "day": "Monday",
      "open": "09:00",
      "close": "18:00",
      "isOpen": true
    }
  ],
  "contactInfo": {
    "phone": "your-phone",
    "email": "your-email",
    "address": "your-address"
  },
  "settings": {
    "autoReply": true,
    "welcomeMessage": "Welcome to our business!",
    "notificationEmail": "notifications@yourbusiness.com"
  }
}
\`\`\`

## Available Bot Commands
- /start - Initialize the bot and see main menu
- /info - Get business information
- /book - Book an appointment
- /order - Place an order
- /help - Show help message

## Customization Options
1. Working Hours
2. Services and Pricing
3. Welcome Messages
4. Auto-Reply Settings
5. Notification Preferences

## Security Features
- JWT Authentication for dashboard
- IP Whitelist for MongoDB
- Secure Environment Variables
- CORS Protection

## Monitoring and Maintenance
- Check MongoDB Atlas dashboard for database metrics
- Monitor bot interactions through logging
- Regular backup of business data
- Update dependencies periodically

## Troubleshooting
Common issues and solutions:
1. Connection Issues
   - Verify MongoDB connection string
   - Check IP whitelist
   - Confirm network connectivity

2. Bot Not Responding
   - Verify bot token
   - Check server logs
   - Ensure webhook is properly set

3. Database Errors
   - Check MongoDB Atlas status
   - Verify database user permissions
   - Confirm proper connection string format

## Support and Updates
For support:
- Create an issue in the repository
- Contact system administrator
- Check documentation updates

## License
[Your License Type]

## Version History
- 1.0.0: Initial release
  - Basic bot functionality
  - Business management
  - Customer interaction tracking 