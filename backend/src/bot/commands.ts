import { Context, Markup, Telegraf } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import Business from '../models/Business';
import Customer from '../models/Customer';

export const setupCommands = (bot: Telegraf) => {
  // Start command
  bot.command('start', async (ctx: Context) => {
    const welcomeMessage = `👋 Welcome to our Business Bot!
    
Here are the available commands:
/info - Get business information
/book - Book an appointment
/order - Place an order
/help - Get help with commands`;

    await ctx.reply(welcomeMessage, Markup.keyboard([
      ['ℹ️ Info', '📅 Book Appointment'],
      ['🛍️ Order', '❓ Help']
    ]).resize());

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
            businessId: 'default', // We'll need to implement proper business assignment
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
  bot.command('info', async (ctx: Context) => {
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

  // Book command
  bot.command('book', async (ctx: Context) => {
    try {
      const business = await Business.findOne();
      if (!business) {
        return ctx.reply('Booking is currently unavailable.');
      }

      const services = business.services.map(service => [
        Markup.button.callback(
          `${service.name} - $${service.price}`,
          `book_service_${service._id || 'unknown'}`
        )
      ]);

      await ctx.reply('Please select a service to book:', 
        Markup.inlineKeyboard([
          ...services,
          [Markup.button.callback('Cancel', 'cancel_booking')]
        ])
      );
    } catch (error) {
      console.error('Error setting up booking:', error);
      await ctx.reply('Sorry, there was an error with the booking system.');
    }
  });

  // Order command
  bot.command('order', async (ctx: Context) => {
    try {
      const business = await Business.findOne();
      if (!business) {
        return ctx.reply('Ordering is currently unavailable.');
      }

      const services = business.services.map(service => [
        Markup.button.callback(
          `${service.name} - $${service.price}`,
          `order_service_${service._id || 'unknown'}`
        )
      ]);

      await ctx.reply('Please select items to order:',
        Markup.inlineKeyboard([
          ...services,
          [Markup.button.callback('View Cart', 'view_cart')],
          [Markup.button.callback('Cancel', 'cancel_order')]
        ])
      );
    } catch (error) {
      console.error('Error setting up order:', error);
      await ctx.reply('Sorry, there was an error with the ordering system.');
    }
  });

  // Help command
  bot.command('help', async (ctx: Context) => {
    const helpMessage = `🤖 Available Commands:

/start - Start the bot and show main menu
/info - Get business information and working hours
/book - Book an appointment for services
/order - Place an order for products/services
/help - Show this help message

Need more assistance? Contact us through the business information.`;

    await ctx.reply(helpMessage);
  });

  // Handle unknown commands
  bot.on('text', async (ctx: Context) => {
    const msg = ctx.message as Message.TextMessage;
    if (msg.text?.startsWith('/')) {
      await ctx.reply('Sorry, I don\'t recognize that command. Use /help to see available commands.');
    }
  });
};

export default setupCommands; 