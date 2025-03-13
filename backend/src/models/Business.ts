import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IService {
  _id?: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  category?: string;
  availability?: {
    maxParticipants?: number;
    minParticipants?: number;
    requiresDeposit?: boolean;
    depositAmount?: number;
    advanceBookingDays?: number;
    advanceBookingHours?: number;
  };
  customFields?: Array<{
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}

export interface IMenuItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  options?: Array<{
    name: string;
    choices: Array<{
      name: string;
      price: number;
    }>;
  }>;
  customizations?: Array<{
    name: string;
    price: number;
  }>;
  availability?: {
    daysAvailable?: string[];
    timeSlots?: Array<{
      start: string;
      end: string;
    }>;
  };
}

interface ISettings {
  autoReply: boolean;
  welcomeMessage: string;
  notificationEmail: string;
  languages: string[];
  currency: string;
  timeZone: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    telegramId: string;
  };
  customization: {
    commandList: Array<{
      command: string;
      response: string;
      description: string;
      enabled: boolean;
    }>;
    autoResponses: Array<{
      trigger: string;
      response: string;
    }>;
  };
}

export interface IBusiness extends Document {
  name: string;
  ownerId: string;
  password: string;
  description?: string;
  businessType: string;
  services: IService[];
  menu?: {
    categories: Array<{
      name: string;
      items: IMenuItem[];
    }>;
  };
  workingHours: Array<{
    day: string;
    open: string;
    close: string;
    isOpen: boolean;
    breakTime?: {
      start: string;
      end: string;
    };
  }>;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      website?: string;
    };
  };
  settings: ISettings;
  analytics?: {
    customerSegments?: string[];
    popularServices?: string[];
    peakHours?: Array<{
      day: string;
      hours: string[];
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number },
  category: { type: String },
  availability: {
    maxParticipants: Number,
    minParticipants: Number,
    requiresDeposit: Boolean,
    depositAmount: Number,
    advanceBookingDays: Number,
    advanceBookingHours: Number,
  },
  customFields: [{
    name: String,
    type: String,
    required: Boolean,
    options: [String],
  }],
});

const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  options: [{
    name: String,
    choices: [{
      name: String,
      price: Number,
    }],
  }],
  customizations: [{
    name: String,
    price: Number,
  }],
  availability: {
    daysAvailable: [String],
    timeSlots: [{
      start: String,
      end: String,
    }],
  },
});

const BusinessSchema: Schema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  password: { type: String, required: true },
  description: { type: String },
  businessType: { type: String, required: true },
  services: [ServiceSchema],
  menu: {
    categories: [{
      name: String,
      items: [MenuItemSchema],
    }],
  },
  workingHours: [{
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    breakTime: {
      start: String,
      end: String,
    },
  }],
  contactInfo: {
    phone: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    address: { type: String, default: '' },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      website: String,
    },
  },
  settings: {
    autoReply: { type: Boolean, default: true },
    welcomeMessage: { type: String, default: 'Welcome to our business!' },
    notificationEmail: { type: String, required: true },
    languages: { type: [String], default: ['en'] },
    currency: { type: String, default: 'USD' },
    timeZone: { type: String, default: 'UTC' },
    theme: {
      primaryColor: { type: String, default: '#4F46E5' },
      secondaryColor: { type: String, default: '#6B7280' },
      logo: String,
    },
    features: {
      enableBooking: { type: Boolean, default: true },
      enableOrdering: { type: Boolean, default: true },
      enableDelivery: { type: Boolean, default: false },
      enablePayments: { type: Boolean, default: false },
      enableReviews: { type: Boolean, default: true },
      enableChat: { type: Boolean, default: true },
    },
    booking: {
      maxDaysInAdvance: { type: Number, default: 30 },
      minNoticeHours: { type: Number, default: 2 },
      maxPartySize: { type: Number, default: 10 },
      autoConfirm: { type: Boolean, default: false },
      requireDeposit: { type: Boolean, default: false },
      depositAmount: { type: Number, default: 0 },
      cancellationPolicy: { type: String, default: '24 hours notice required' },
    },
    ordering: {
      minimumOrder: { type: Number, default: 0 },
      preparationTime: { type: Number, default: 30 },
      deliveryRadius: { type: Number, default: 5 },
      deliveryFee: { type: Number, default: 5 },
      freeDeliveryOver: { type: Number, default: 50 },
      allowPickup: { type: Boolean, default: true },
      allowDelivery: { type: Boolean, default: true },
    },
    notifications: {
      email: { type: Boolean, default: true },
      telegram: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      newBooking: { type: Boolean, default: true },
      newOrder: { type: Boolean, default: true },
      orderStatus: { type: Boolean, default: true },
      customerMessages: { type: Boolean, default: true },
    },
    customization: {
      commandList: [{
        command: String,
        response: String,
        description: String,
        enabled: Boolean
      }],
      autoResponses: [{
        trigger: String,
        response: String
      }]
    },
  },
  analytics: {
    customerSegments: [String],
    popularServices: [String],
    peakHours: [{
      day: String,
      hours: [String],
    }],
  },
}, {
  timestamps: true
});

// Index for faster email lookups
BusinessSchema.index({ 'contactInfo.email': 1 });
BusinessSchema.index({ businessType: 1 });
BusinessSchema.index({ 'services.category': 1 });

export default mongoose.model<IBusiness>('Business', BusinessSchema); 