import { Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { BotContext } from '../session';
import Business from '../../models/Business';
import { generateAIResponse } from '../../services/openai';
import Customer from '../../models/Customer';

export const handleCustomCommand = async (ctx: BotContext, command: string) => {
  try {
    const business = await Business.findOne();
    if (!business) {
      return ctx.reply('Business not found');
    }

    // Find the command in the business's command list
    const customCommand = business.settings.customization.commandList
      .find(cmd => cmd.command === command && cmd.enabled);

    if (!customCommand) {
      return ctx.reply('Command not found or disabled');
    }

    // Check if there's an auto-response for this command
    const autoResponse = business.settings.customization.autoResponses
      .find(response => response.trigger.toLowerCase() === command.toLowerCase());

    if (autoResponse) {
      return ctx.reply(autoResponse.response, {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ['ℹ️ Info', '📅 Book Appointment'],
          ['🛍️ Order', '❓ Help']
        ]).resize()
      });
    }

    // If no auto-response, send the command description
    return ctx.reply(customCommand.description, {
      parse_mode: 'HTML',
      ...Markup.keyboard([
        ['ℹ️ Info', '📅 Book Appointment'],
        ['🛍️ Order', '❓ Help']
      ]).resize()
    });
  } catch (error) {
    console.error('Error handling custom command:', error);
    return ctx.reply('Sorry, there was an error processing your command');
  }
};

export const handleMessage = async (ctx: BotContext) => {
  try {
    const message = ctx.message as Message.TextMessage;
    if (!message || !message.text) return;

    const business = await Business.findOne();
    if (!business) {
      return ctx.reply('Business not found');
    }

    // Get customer's previous interactions for context
    const customer = await Customer.findOne({ 
      telegramId: ctx.from?.id.toString() 
    }).sort({ 'interactions.timestamp': -1 }).limit(5);

    const previousMessages = customer?.interactions.map(interaction => ({
      role: interaction.type === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
      content: interaction.message
    }));

    // Check for auto-responses first
    const autoResponse = business.settings.customization.autoResponses
      .find(response => 
        message.text.toLowerCase().includes(response.trigger.toLowerCase())
      );

    if (autoResponse) {
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
        }
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
    const aiResponse = await generateAIResponse(message.text, {
      businessName: business.name,
      businessType: business.businessType,
      previousMessages
    });

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
      }
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
    return ctx.reply('Sorry, there was an error processing your message');
  }
}; 