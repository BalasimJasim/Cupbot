import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  serviceId: string;
  date: Date;
  status: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  items: Array<{
    serviceId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  date: Date;
}

export interface ICustomer extends Document {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  businessId: string;
  preferences?: {
    language: string;
    notifications: boolean;
  };
  interactions: Array<{
    type: string;
    message: string;
    timestamp: Date;
  }>;
  bookings: IBooking[];
  orders: IOrder[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  username: { type: String },
  businessId: { type: String, required: true },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  interactions: [{
    type: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  bookings: [{
    serviceId: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, default: 'pending' }
  }],
  orders: [{
    items: [{
      serviceId: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model<ICustomer>('Customer', CustomerSchema); 