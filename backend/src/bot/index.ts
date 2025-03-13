import { Telegraf, session } from 'telegraf';
import { BotContext, defaultSession } from './session';
import {
  handleBookingStart,
  handleServiceSelection,
  handleDateSelection,
  handleTimeSelection,
  handleBookingCancel
} from './handlers/booking';
import {
  handleOrderStart,
  handleCategorySelection,
  handleItemSelection,
  handleQuantitySelection,
  handleViewCart,
  handleCheckout,
  handleOrderCancel
} from './handlers/order';
import Business from '../models/Business';
import Customer from '../models/Customer';
import { generateAIResponse } from '../services/openai';
import { Markup } from 'telegraf';

export const setupBot = (bot: Telegraf<BotContext>) => {
  // Add session middleware
  bot.use(session({
    defaultSession: () => defaultSession
  }));

  // Start command
  bot.command('start', async (ctx) => {
    const welcomeMessage = `👋 Welcome to our Business Bot!
    
Here are the available commands:
/info - Get business information
/book - Book an appointment
/order - Place an order
/help - Get help with commands`;

    await ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [
          ['ℹ️ Info', '📅 Book Appointment'],
          ['🛍️ Order', '❓ Help']
        ],
        resize_keyboard: true
      }
    });

    // Save or update customer
    try {
      const telegramUser = ctx.from;
      if (telegramUser) {
        await Customer.findOneAndUpdate(
          { telegramId: telegramUser.id.toString() },
          {
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
            businessId: 'default',
            $push: {
              interactions: {
                type: 'start',
                message: 'Started bot interaction',
                timestamp: new Date()
              }
            }
          },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  });

  // Info command
  bot.command('info', async (ctx) => {
    try {
      const business = await Business.findOne();
      if (!business) {
        return ctx.reply('Business information not available.');
      }

      const infoMessage = `🏢 ${business.name}

📝 Description:
${business.description}

⏰ Working Hours:
${business.workingHours.map(hour => 
  `${hour.day}: ${hour.isOpen ? `${hour.open} - ${hour.close}` : 'Closed'}`
).join('\n')}

📞 Contact:
Phone: ${business.contactInfo.phone}
Email: ${business.contactInfo.email}
Address: ${business.contactInfo.address}`;

      await ctx.reply(infoMessage);
    } catch (error) {
      console.error('Error fetching business info:', error);
      await ctx.reply('Sorry, there was an error fetching business information.');
    }
  });

  // Booking flow
  bot.command('book', handleBookingStart);
  bot.action(/^booking_service_(.+)$/, handleServiceSelection);
  bot.action(/^booking_date_(.+)$/, handleDateSelection);
  bot.action(/^booking_time_(.+)$/, handleTimeSelection);
  bot.action('booking_cancel', handleBookingCancel);

  // Order flow
  bot.command('order', handleOrderStart);
  bot.action(/^order_category_(.+)$/, handleCategorySelection);
  bot.action(/^order_item_(.+)$/, handleItemSelection);
  bot.action(/^order_quantity_(.+)_(\d+)$/, handleQuantitySelection);
  bot.action('view_cart', handleViewCart);
  bot.action('order_checkout', handleCheckout);
  bot.action('order_cancel', handleOrderCancel);
  bot.action('order_categories', handleOrderStart);

  // Help command
  bot.command('help', async (ctx) => {
    const helpMessage = `🤖 Available Commands:

/start - Start the bot and show main menu
/info - Get business information and working hours
/book - Book an appointment for services
/order - Place an order for products/services
/help - Show this help message

Need more assistance? Contact us through the business information.`;

    await ctx.reply(helpMessage);
  });

  // Handle text messages
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    switch (text) {
      case 'ℹ️ Info':
        return bot.telegram.sendMessage(ctx.chat.id, '/info');
      case '📅 Book Appointment':
        return handleBookingStart(ctx);
      case '🛍️ Order':
        return handleOrderStart(ctx);
      case '❓ Help':
        return bot.telegram.sendMessage(ctx.chat.id, '/help');
      default:
        if (text.startsWith('/')) {
          return ctx.reply('Sorry, I don\'t recognize that command. Use /help to see available commands.');
        }
        
        try {
          // Get business and customer information
          const business = await Business.findOne();
          if (!business) {
            return ctx.reply('Sorry, the service is currently unavailable.');
          }

          // Get customer's previous interactions for context
          const customer = await Customer.findOne({ 
            telegramId: ctx.from?.id.toString() 
          }).sort({ 'interactions.timestamp': -1 }).limit(5);

          const previousMessages = customer?.interactions?.map(interaction => ({
            fromBot: interaction.type === 'bot',
            text: interaction.message
          })) || [];

          // Check for auto-responses first
          const autoResponse = business.settings.customization.autoResponses
            .find(response => 
              text.toLowerCase().includes(response.trigger.toLowerCase())
            );

          if (autoResponse) {
            // Save the interaction
            await Customer.findOneAndUpdate(
              { telegramId: ctx.from?.id.toString() },
              {
                $push: {
                  interactions: {
                    type: 'bot',
                    message: autoResponse.response,
                    timestamp: new Date()
                  }
                }
              },
              { upsert: true }
            );

            return ctx.reply(autoResponse.response, {
              parse_mode: 'HTML',
              ...Markup.keyboard([
                ['ℹ️ Info', '📅 Book Appointment'],
                ['🛍️ Order', '❓ Help']
              ]).resize()
            });
          }

          // If no auto-response, use AI to generate a response
          const aiResponse = await generateAIResponse(text, business, previousMessages);

          // Save the interaction
          await Customer.findOneAndUpdate(
            { telegramId: ctx.from?.id.toString() },
            {
              $push: {
                interactions: {
                  type: 'bot',
                  message: aiResponse,
                  timestamp: new Date()
                }
              }
            },
            { upsert: true }
          );

          return ctx.reply(aiResponse, {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              ['ℹ️ Info', '📅 Book Appointment'],
              ['🛍️ Order', '❓ Help']
            ]).resize()
          });
        } catch (error) {
          console.error('Error handling message:', error);
          return ctx.reply('Sorry, there was an error processing your message. Please try using specific commands like /help, /book, or /order.');
        }
    }
  });

  // Error handling
  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  });
};

export default setupBot; 