import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { BotContext } from '../bot/session';

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN);

// Middleware to log all bot interactions
bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date().getTime() - start.getTime();
  console.log('Response time: %sms', ms);
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  ctx.reply('An error occurred while processing your request.');
});

export default bot; 