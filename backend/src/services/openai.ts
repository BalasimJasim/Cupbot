import axios from 'axios';
import { IBusiness } from '../models/Business';
import { Message } from '../types/message';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

function generateSystemPrompt(business: IBusiness): string {
  return `You are a friendly and professional AI assistant for ${business.name}, a ${business.businessType}. 
Your responses should be:
- Concise (under 150 words)
- Professional yet friendly
- Focused on ${business.businessType}-related topics
- Include appropriate emojis
- Guide users to specific commands (/book, /order, /info) when relevant

For specific actions like booking appointments or placing orders, direct users to use the dedicated commands.
Provide accurate information about the business's services, hours, and policies.`;
}

function containsKeywords(text: string, keywords: string[]): boolean {
  const lowercaseText = text.toLowerCase();
  return keywords.some(keyword => lowercaseText.includes(keyword.toLowerCase()));
}

function generateRuleBasedResponse(message: string, business: IBusiness): string {
  const text = message.toLowerCase();
  
  // Menu/Products related
  if (containsKeywords(text, ['menu', 'products', 'items', 'food', 'drinks', 'price'])) {
    return `🍽️ You can browse our complete menu and prices using the /order command!`;
  }
  
  // Hours/Time related
  if (containsKeywords(text, ['hours', 'open', 'close', 'time', 'schedule', 'when'])) {
    const hoursText = business.workingHours.map(h => 
      `${h.day}: ${h.isOpen ? `${h.open} - ${h.close}` : 'Closed'}`
    ).join('\n');
    return `⏰ We're open during these hours:\n${hoursText}\nFeel free to use /info for more details!`;
  }
  
  // Booking related
  if (containsKeywords(text, ['book', 'appointment', 'schedule', 'reservation'])) {
    return `📅 Ready to make a booking? Use the /book command to schedule your appointment!`;
  }
  
  // Location related
  if (containsKeywords(text, ['where', 'location', 'address', 'directions'])) {
    return `📍 You can find us at: ${business.contactInfo.address}\nUse /info for more details!`;
  }
  
  // Services related
  if (containsKeywords(text, ['service', 'offer', 'provide', 'available'])) {
    const serviceList = business.services.map(s => `- ${s.name}`).join('\n');
    return `✨ We offer these services:\n${serviceList}\nUse /info to see our complete list of services.`;
  }
  
  // Order related
  if (containsKeywords(text, ['order', 'delivery', 'pickup', 'takeout'])) {
    return `🛍️ Ready to place an order? Use the /order command to start ordering!`;
  }
  
  // Help/Support
  if (containsKeywords(text, ['help', 'support', 'assist', 'how'])) {
    return `💡 Here are the available commands:\n/start - Start interacting with the bot\n/info - Get business information\n/book - Make an appointment\n/order - Place an order\n/help - Show this help message`;
  }
  
  // Default response
  return `👋 How can I assist you today? You can use these commands:\n/info - Business information\n/book - Make an appointment\n/order - Place an order\n/help - Show all commands`;
}

export async function generateAIResponse(
  messageText: string,
  business: IBusiness,
  previousMessages: Message[] = []
): Promise<string> {
  try {
    if (!DEEPSEEK_API_KEY) {
      console.warn('DeepSeek API key not configured, falling back to rule-based responses');
      return generateRuleBasedResponse(messageText, business);
    }

    const messages = [
      { role: 'system', content: generateSystemPrompt(business) },
      ...previousMessages.map(msg => ({
        role: msg.fromBot ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: messageText }
    ];

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages,
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fall back to rule-based response if AI fails
    return generateRuleBasedResponse(messageText, business);
  }
} 