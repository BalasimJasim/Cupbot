import { Markup } from 'telegraf';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { BotContext, updateSession, clearSession } from '../session';
import Business from '../../models/Business';
import Customer from '../../models/Customer';
import { IMenuItem } from '../../models/Business';

interface OrderItem {
  serviceId: string;
  quantity: number;
  price: number;
}

interface Order {
  items: OrderItem[];
  total: number;
}

export const handleOrderStart = async (ctx: BotContext) => {
  try {
    const business = await Business.findOne();
    if (!business || !business.menu) {
      return ctx.reply('Ordering is currently unavailable.');
    }

    // Group menu items by category
    const categories = business.menu.categories.map(category => [
      Markup.button.callback(
        `📑 ${category.name}`,
        `order_category_${category.name}`
      )
    ]);

    updateSession(ctx, {
      step: 'order_select_category',
      data: { order: { items: [], total: 0 } }
    });

    await ctx.reply(
      'Please select a category:',
      Markup.inlineKeyboard([
        ...categories,
        [Markup.button.callback('❌ Cancel', 'order_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in order start:', error);
    await ctx.reply('Sorry, there was an error with the ordering system.');
  }
};

export const handleCategorySelection = async (ctx: BotContext) => {
  try {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const categoryName = callbackQuery.data.replace('order_category_', '');
    
    const business = await Business.findOne();
    if (!business || !business.menu) {
      return ctx.reply('Menu not available. Please try again later.');
    }

    const category = business.menu.categories.find(c => c.name === categoryName);
    if (!category) {
      return ctx.reply('Category not found. Please try again.');
    }

    const items = category.items.map(item => [
      Markup.button.callback(
        `${item.name} - $${item.price.toFixed(2)}`,
        `order_item_${item._id || ''}`
      )
    ]);

    await ctx.reply(
      `Please select an item from ${categoryName}:`,
      Markup.inlineKeyboard([
        ...items,
        [Markup.button.callback('⬅️ Back to Categories', 'order_categories')],
        [Markup.button.callback('❌ Cancel', 'order_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in category selection:', error);
    await ctx.reply('Sorry, there was an error processing your selection.');
  }
};

export const handleItemSelection = async (ctx: BotContext) => {
  try {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const itemId = callbackQuery.data.replace('order_item_', '');
    
    const business = await Business.findOne();
    if (!business || !business.menu) {
      return ctx.reply('Menu not available. Please try again later.');
    }

    const item = business.menu.categories
      .flatMap(c => c.items)
      .find(i => i._id?.toString() === itemId);

    if (!item) {
      return ctx.reply('Item not found. Please try again.');
    }

    // Generate quantity buttons (1-5)
    const quantityButtons = Array.from({ length: 5 }, (_, i) => i + 1).map(qty => [
      Markup.button.callback(
        `${qty}x`,
        `order_quantity_${itemId}_${qty}`
      )
    ]);

    await ctx.reply(
      `How many ${item.name} would you like?`,
      Markup.inlineKeyboard([
        ...quantityButtons,
        [Markup.button.callback('❌ Cancel', 'order_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in item selection:', error);
    await ctx.reply('Sorry, there was an error processing your selection.');
  }
};

export const handleQuantitySelection = async (ctx: BotContext) => {
  try {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const [itemId, quantityStr] = callbackQuery.data
      .replace('order_quantity_', '')
      .split('_');
    
    const quantity = parseInt(quantityStr, 10);
    
    const business = await Business.findOne();
    if (!business || !business.menu) {
      return ctx.reply('Menu not available. Please try again later.');
    }

    const item = business.menu.categories
      .flatMap(c => c.items)
      .find(i => i._id?.toString() === itemId);

    if (!item) {
      return ctx.reply('Item not found. Please try again.');
    }

    const currentOrder = ctx.session.data.order || { items: [], total: 0 };
    const itemPrice = Number(item.price);
    if (isNaN(itemPrice)) {
      return ctx.reply('Invalid item price. Please try again.');
    }

    const newItem: OrderItem = {
      serviceId: itemId,
      quantity: quantity,
      price: itemPrice * quantity
    };

    const updatedOrder: Order = {
      items: [...currentOrder.items, newItem],
      total: currentOrder.total + newItem.price
    };

    updateSession(ctx, {
      step: 'order_added_item',
      data: {
        order: updatedOrder
      }
    });

    await ctx.reply(
      `Added ${quantity}x ${item.name} to your cart.\nTotal: $${updatedOrder.total.toFixed(2)}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🛒 View Cart', 'view_cart')],
        [Markup.button.callback('📝 Order More', 'order_categories')],
        [Markup.button.callback('❌ Cancel Order', 'order_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in quantity selection:', error);
    await ctx.reply('Sorry, there was an error processing your selection.');
  }
};

export const handleViewCart = async (ctx: BotContext) => {
  try {
    const currentOrder = ctx.session.data.order;
    if (!currentOrder || currentOrder.items.length === 0) {
      return ctx.reply('Your cart is empty.');
    }

    const business = await Business.findOne();
    if (!business || !business.menu) {
      return ctx.reply('Menu not available. Please try again later.');
    }

    const itemsList = currentOrder.items.map(item => {
      const menuItem = business.menu!.categories
        .flatMap(c => c.items)
        .find(i => i._id?.toString() === item.serviceId);
      
      return menuItem ? 
        `${item.quantity}x ${menuItem.name} - $${item.price.toFixed(2)}` :
        'Item not found';
    }).join('\n');

    const message = `🛒 Your Cart:\n\n${itemsList}\n\nTotal: $${currentOrder.total.toFixed(2)}`;

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Checkout', 'order_checkout')],
        [Markup.button.callback('📝 Order More', 'order_categories')],
        [Markup.button.callback('❌ Cancel Order', 'order_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in view cart:', error);
    await ctx.reply('Sorry, there was an error viewing your cart.');
  }
};

export const handleCheckout = async (ctx: BotContext) => {
  try {
    const currentOrder = ctx.session.data.order;
    if (!currentOrder || currentOrder.items.length === 0) {
      return ctx.reply('Your cart is empty.');
    }

    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return ctx.reply('User information not found. Please try again.');
    }

    const customer = await Customer.findOne({ telegramId });
    if (!customer) {
      return ctx.reply('Customer information not found. Please try again.');
    }

    // Create the order
    await Customer.findOneAndUpdate(
      { _id: customer._id },
      {
        $push: {
          orders: {
            items: currentOrder.items,
            total: currentOrder.total,
            status: 'pending',
            date: new Date()
          }
        }
      }
    );

    clearSession(ctx);

    await ctx.reply(
      `✅ Order placed successfully!\n\nTotal: $${currentOrder.total.toFixed(2)}\n\nWe will notify you when your order is confirmed.`,
      Markup.inlineKeyboard([[
        Markup.button.callback('📋 View My Orders', 'view_orders')
      ]])
    );
  } catch (error) {
    console.error('Error in checkout:', error);
    await ctx.reply('Sorry, there was an error processing your order.');
  }
};

export const handleOrderCancel = async (ctx: BotContext) => {
  clearSession(ctx);
  await ctx.reply(
    'Order cancelled. How else can I help you?',
    Markup.keyboard([
      ['ℹ️ Info', '📅 Book Appointment'],
      ['🛍️ Order', '❓ Help']
    ]).resize()
  );
}; 