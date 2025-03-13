import { Markup } from 'telegraf';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { BotContext, updateSession, clearSession } from '../session';
import Business from '../../models/Business';
import Customer from '../../models/Customer';
import { format, addDays } from 'date-fns';

export const handleBookingStart = async (ctx: BotContext) => {
  try {
    const business = await Business.findOne();
    if (!business) {
      return ctx.reply('Booking is currently unavailable.');
    }

    // Group services by category
    const servicesByCategory = business.services.reduce((acc, service) => {
      const category = service.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as Record<string, typeof business.services>);

    // Create keyboard with categories and services
    const keyboard = Object.entries(servicesByCategory).flatMap(([category, services]) => [
      [Markup.button.callback(`📑 ${category}`, `booking_category_${category}`)],
      ...services.map(service => [
        Markup.button.callback(
          `${service.name} - $${service.price}`,
          `booking_service_${service._id}`
        )
      ])
    ]);

    updateSession(ctx, {
      step: 'booking_select_service',
      data: { booking: {} }
    });

    await ctx.reply(
      'Please select a service to book:',
      Markup.inlineKeyboard([
        ...keyboard,
        [Markup.button.callback('❌ Cancel', 'booking_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in booking start:', error);
    await ctx.reply('Sorry, there was an error with the booking system.');
  }
};

export const handleServiceSelection = async (ctx: BotContext) => {
  try {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const serviceId = callbackQuery.data.replace('booking_service_', '');
    
    const business = await Business.findOne();
    const service = business?.services.find(s => s._id?.toString() === serviceId);

    if (!service) {
      return ctx.reply('Service not found. Please try again.');
    }

    updateSession(ctx, {
      step: 'booking_select_date',
      data: {
        booking: {
          ...ctx.session.data.booking,
          serviceId
        }
      }
    });

    // Generate available dates for next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), i + 1);
      return [
        Markup.button.callback(
          format(date, 'EEE, MMM d'),
          `booking_date_${format(date, 'yyyy-MM-dd')}`
        )
      ];
    });

    await ctx.reply(
      `You selected: ${service.name}\nPlease choose a date:`,
      Markup.inlineKeyboard([
        ...dates,
        [Markup.button.callback('❌ Cancel', 'booking_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in service selection:', error);
    await ctx.reply('Sorry, there was an error processing your selection.');
  }
};

export const handleDateSelection = async (ctx: BotContext) => {
  try {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const selectedDate = callbackQuery.data.replace('booking_date_', '');
    
    const business = await Business.findOne();
    
    if (!business) {
      return ctx.reply('Business information not available.');
    }

    updateSession(ctx, {
      step: 'booking_select_time',
      data: {
        booking: {
          ...ctx.session.data.booking,
          date: selectedDate
        }
      }
    });

    // Generate time slots based on business hours
    const [year, month, day] = selectedDate.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    const dayOfWeek = format(parsedDate, 'EEEE');
    const workingHours = business.workingHours.find(h => h.day === dayOfWeek);

    if (!workingHours || !workingHours.isOpen) {
      return ctx.reply('Sorry, we are closed on this day. Please select another date.');
    }

    // Parse time strings into Date objects
    const [startHour, startMinute] = workingHours.open.split(':').map(Number);
    const [endHour, endMinute] = workingHours.close.split(':').map(Number);
    
    const startTime = new Date(parsedDate);
    startTime.setHours(startHour, startMinute, 0);
    
    const endTime = new Date(parsedDate);
    endTime.setHours(endHour, endMinute, 0);

    const timeSlots = [];
    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      timeSlots.push([
        Markup.button.callback(
          format(currentTime, 'h:mm a'),
          `booking_time_${format(currentTime, 'HH:mm')}`
        )
      ]);
      currentTime = new Date(currentTime.setHours(currentTime.getHours() + 1));
    }

    await ctx.reply(
      'Please select a time:',
      Markup.inlineKeyboard([
        ...timeSlots,
        [Markup.button.callback('❌ Cancel', 'booking_cancel')]
      ])
    );
  } catch (error) {
    console.error('Error in date selection:', error);
    await ctx.reply('Sorry, there was an error processing your selection.');
  }
};

export const handleTimeSelection = async (ctx: BotContext) => {
  try {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const selectedTime = callbackQuery.data.replace('booking_time_', '');
    const booking = ctx.session.data.booking;
    
    if (!booking || !booking.serviceId || !booking.date) {
      return ctx.reply('Booking information incomplete. Please start over.');
    }

    const business = await Business.findOne();
    const service = business?.services.find(s => s._id?.toString() === booking.serviceId);

    if (!service) {
      return ctx.reply('Service not found. Please start over.');
    }

    // Create the booking
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return ctx.reply('User information not found. Please start over.');
    }

    const customer = await Customer.findOne({ telegramId });
    if (!customer) {
      return ctx.reply('Customer information not found. Please start over.');
    }

    // Parse the date and time
    const [year, month, day] = booking.date.split('-').map(Number);
    const [hour, minute] = selectedTime.split(':').map(Number);
    
    const bookingDateTime = new Date(year, month - 1, day);
    bookingDateTime.setHours(hour, minute, 0);

    await Customer.findOneAndUpdate(
      { _id: customer._id },
      {
        $push: {
          bookings: {
            serviceId: booking.serviceId,
            date: bookingDateTime,
            status: 'pending'
          }
        }
      },
      { new: true }
    );

    clearSession(ctx);

    await ctx.reply(
      `✅ Booking confirmed!\n\nService: ${service.name}\nDate: ${format(bookingDateTime, 'MMMM d, yyyy')}\nTime: ${format(bookingDateTime, 'h:mm a')}\n\nWe will notify you when your booking is confirmed.`,
      Markup.inlineKeyboard([[
        Markup.button.callback('📋 View My Bookings', 'view_bookings')
      ]])
    );
  } catch (error) {
    console.error('Error in time selection:', error);
    await ctx.reply('Sorry, there was an error processing your booking.');
  }
};

export const handleBookingCancel = async (ctx: BotContext) => {
  clearSession(ctx);
  await ctx.reply(
    'Booking cancelled. How else can I help you?',
    Markup.keyboard([
      ['ℹ️ Info', '📅 Book Appointment'],
      ['🛍️ Order', '❓ Help']
    ]).resize()
  );
}; 