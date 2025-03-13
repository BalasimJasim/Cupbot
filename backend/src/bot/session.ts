import { Context } from 'telegraf';

interface OrderItem {
  serviceId: string;
  quantity: number;
  price: number;
}

interface Order {
  items: OrderItem[];
  total: number;
}

interface SessionData {
  step: string;
  data: {
    booking?: {
      serviceId?: string;
      date?: string;
      time?: string;
      guests?: number;
    };
    order?: Order;
  };
}

export interface BotContext extends Context {
  session: SessionData;
}

export const defaultSession: SessionData = {
  step: 'idle',
  data: {
    booking: {},
    order: {
      items: [],
      total: 0
    }
  }
};

export const getSession = (ctx: BotContext): SessionData => {
  return ctx.session || defaultSession;
};

export const clearSession = (ctx: BotContext): void => {
  ctx.session = defaultSession;
};

export const updateSession = (ctx: BotContext, updates: Partial<SessionData>): void => {
  ctx.session = {
    ...ctx.session,
    ...updates
  };
};

export const isInBookingFlow = (ctx: BotContext): boolean => {
  return ctx.session?.step?.startsWith('booking_');
};

export const isInOrderFlow = (ctx: BotContext): boolean => {
  return ctx.session?.step?.startsWith('order_');
}; 