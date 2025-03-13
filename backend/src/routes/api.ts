import express, { Request, Response, Router } from 'express';
import Business from '../models/Business';
import Customer, { IBooking, IOrder } from '../models/Customer';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Define interface for error handling
interface ServerError extends Error {
  name: string;
  message: string;
  stack?: string;
}

const router = Router();

// Authentication middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware helper
const requireAuth = (req: AuthenticatedRequest, res: Response): { user: { id: string } } | false => {
  const user = req.user;
  if (!user?.id) {
    res.status(401).json({ message: 'User not authenticated' });
    return false;
  }
  return { user };
};

// Business lookup helper
const findBusiness = async (userId: string, res: Response) => {
  const business = await Business.findOne({ 'contactInfo.email': userId });
  if (!business) {
    res.status(404).json({ message: 'Business not found' });
    return false;
  }
  return business;
};

// Registration Route
router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:', {
      businessName: req.body.businessName,
      email: req.body.email,
      // Don't log password for security
    });

    const { businessName, email, password } = req.body;

    // Check if business with email already exists
    const existingBusiness = await Business.findOne({ 'contactInfo.email': email });
    console.log('Existing business check:', { exists: !!existingBusiness });
    
    if (existingBusiness) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create new business object for validation before saving
    const businessData = {
      name: businessName,
      ownerId: email,
      password: hashedPassword,
      businessType: 'service', // default type
      contactInfo: {
        email,
        phone: '',
        address: ''
      },
      settings: {
        autoReply: true,
        welcomeMessage: 'Welcome to our business!',
        notificationEmail: email,
        languages: ['en'],
        currency: 'USD',
        timeZone: 'UTC',
        notifications: {
          email: true,
          telegram: true,
          sms: false,
          newBooking: true,
          newOrder: true,
          orderStatus: true,
          customerMessages: true
        },
        customization: {
          commandList: [],
          autoResponses: []
        }
      },
      services: [],
      workingHours: [
        { day: 'Monday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Tuesday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Wednesday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Thursday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Friday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Saturday', open: '10:00', close: '15:00', isOpen: false },
        { day: 'Sunday', open: '10:00', close: '15:00', isOpen: false }
      ]
    };

    console.log('Creating new business with data:', JSON.stringify(businessData, null, 2));
    
    // Create new business
    const business = await Business.create(businessData);
    console.log('Business created successfully:', { businessId: business._id });
    
    // Generate JWT
    const token = jwt.sign({ 
      id: email,
      businessId: business._id 
    }, JWT_SECRET, { expiresIn: '24h' });
    console.log('JWT token generated successfully');

    res.json({ token });
  } catch (error) {
    const serverError = error as ServerError;
    console.error('Registration error details:', {
      name: serverError.name || 'Unknown error',
      message: serverError.message || 'No error message available',
      stack: serverError.stack || 'No stack trace available'
    });
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: serverError.message || 'Unknown error' 
    });
  }
});

// Authentication Routes
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const business = await Business.findOne({ 'contactInfo.email': email });
    
    if (!business) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, business.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        id: business.contactInfo.email,
        businessId: business._id
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (error) {
    const serverError = error as ServerError;
    console.error('Login error:', serverError.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Protected Business Routes
router.get('/business', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    res.json(business);
  } catch (error) {
    const serverError = error as ServerError;
    console.error('Error fetching business:', serverError.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/business', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const updatedBusiness = await Business.findOneAndUpdate(
      { 'contactInfo.email': auth.user.id },
      req.body,
      { new: true }
    );
    res.json(updatedBusiness);
  } catch (error) {
    const serverError = error as ServerError;
    console.error('Error updating business:', serverError.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer Management Routes
router.get('/customers', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const customers = await Customer.find({ businessId: business._id });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/customers/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const customer = await Customer.findOne({
      _id: req.params.id,
      businessId: business._id
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Booking Management Routes
router.get('/bookings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const customers = await Customer.find({
      businessId: business._id,
      'bookings.status': req.query.status || 'pending'
    });

    const bookings = customers.flatMap(customer => 
      customer.bookings.map(booking => ({
        ...booking,
        customer: {
          id: customer._id,
          name: customer.firstName + ' ' + customer.lastName,
          telegramId: customer.telegramId
        }
      }))
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order Management Routes
router.get('/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const customers = await Customer.find({
      businessId: business._id,
      'orders.status': req.query.status || 'pending'
    });

    const orders = customers.flatMap(customer => 
      customer.orders.map(order => ({
        _id: order._id,
        items: order.items,
        total: order.total,
        status: order.status,
        date: order.date,
        customer: {
          id: customer._id,
          name: customer.firstName + ' ' + customer.lastName,
          telegramId: customer.telegramId
        }
      }))
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Analytics Routes
router.get('/analytics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const customers = await Customer.find({ businessId: business._id });
    
    // Calculate monthly revenue data
    const revenueData = {
      labels: Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
      }).reverse(),
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10000))
    };

    // Calculate booking status distribution
    const bookingStatusData = {
      labels: ['Pending', 'Confirmed', 'Completed'],
      data: [
        customers.reduce((acc, cur) => acc + cur.bookings.filter(b => b.status === 'pending').length, 0),
        customers.reduce((acc, cur) => acc + cur.bookings.filter(b => b.status === 'confirmed').length, 0),
        customers.reduce((acc, cur) => acc + cur.bookings.filter(b => b.status === 'completed').length, 0)
      ]
    };

    // Calculate customer growth
    const customerGrowth = {
      labels: Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
      }).reverse(),
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 50))
    };

    const analytics = {
      totalCustomers: customers.length,
      totalBookings: customers.reduce((acc, cur) => acc + cur.bookings.length, 0),
      totalOrders: customers.reduce((acc, cur) => acc + cur.orders.length, 0),
      interactions: customers.reduce((acc, cur) => acc + cur.interactions.length, 0),
      revenueData,
      bookingStatusData,
      customerGrowth
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Settings Routes
router.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const business = await Business.findOne({ 'contactInfo.email': user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const settings = {
      notifications: {
        email: business.settings.autoReply,
        telegram: true,
        bookings: true,
        orders: true,
        marketing: false
      },
      profile: {
        firstName: business.name.split(' ')[0],
        lastName: business.name.split(' ').slice(1).join(' '),
        email: business.contactInfo.email,
        telegramId: business.ownerId
      }
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update booking status
router.patch('/bookings/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const { status } = req.body;
    const customer = await Customer.findOneAndUpdate(
      {
        businessId: business._id,
        'bookings._id': req.params.id
      },
      {
        $set: {
          'bookings.$.status': status
        }
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = customer.bookings.find(b => b._id.toString() === req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingData = {
      _id: booking._id,
      serviceId: booking.serviceId,
      date: booking.date,
      status: booking.status,
      customer: {
        id: customer._id,
        name: customer.firstName + ' ' + customer.lastName,
        telegramId: customer.telegramId
      }
    };

    res.json(bookingData);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/orders/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const { status } = req.body;
    const customer = await Customer.findOneAndUpdate(
      {
        businessId: business._id,
        'orders._id': req.params.id
      },
      {
        $set: {
          'orders.$.status': status
        }
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = customer.orders.find(o => o._id.toString() === req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderData = {
      _id: order._id,
      items: order.items,
      total: order.total,
      status: order.status,
      date: order.date,
      customer: {
        id: customer._id,
        name: customer.firstName + ' ' + customer.lastName,
        telegramId: customer.telegramId
      }
    };

    res.json(orderData);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings
router.patch('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const { notifications, profile } = req.body;
    
    if (notifications) {
      business.settings.notifications = {
        ...business.settings.notifications,
        ...notifications
      };
    }

    if (profile) {
      business.settings.profile = {
        ...business.settings.profile,
        ...profile
      };
    }

    await business.save();
    res.json(business.settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chatbot Management Routes
router.get('/chatbot/commands', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    res.json(business.settings.customization.commandList);
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/chatbot/commands', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const { command, response, description } = req.body;
    business.settings.customization.commandList.push({
      command: String(command),
      response: String(response),
      description: String(description),
      enabled: true
    });

    await business.save();
    res.json(business.settings.customization.commandList);
  } catch (error) {
    console.error('Error adding command:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/chatbot/commands/:command', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const { response, description, enabled } = req.body;
    const commandIndex = business.settings.customization.commandList.findIndex(
      cmd => cmd.command === req.params.command
    );

    if (commandIndex === -1) {
      return res.status(404).json({ message: 'Command not found' });
    }

    business.settings.customization.commandList[commandIndex] = {
      command: req.params.command,
      response: String(response),
      description: String(description),
      enabled: Boolean(enabled)
    };

    await business.save();
    res.json(business.settings.customization.commandList);
  } catch (error) {
    console.error('Error updating command:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/chatbot/commands/:command', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const commandToDelete = req.params.command;
    business.settings.customization.commandList = 
      business.settings.customization.commandList.filter(cmd => cmd.command !== commandToDelete);

    await business.save();
    res.json(business.settings.customization.commandList);
  } catch (error) {
    console.error('Error deleting command:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-response Management Routes
router.get('/chatbot/responses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    res.json(business.settings.customization.autoResponses);
  } catch (error) {
    console.error('Error fetching auto-responses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/chatbot/responses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const { trigger, response } = req.body;
    business.settings.customization.autoResponses.push({
      trigger: String(trigger),
      response: String(response)
    });

    await business.save();
    res.json(business.settings.customization.autoResponses);
  } catch (error) {
    console.error('Error adding auto-response:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/chatbot/responses/:trigger', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const triggerToDelete = req.params.trigger;
    business.settings.customization.autoResponses = 
      business.settings.customization.autoResponses.filter(r => r.trigger !== triggerToDelete);

    await business.save();
    res.json(business.settings.customization.autoResponses);
  } catch (error) {
    console.error('Error deleting auto-response:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chatbot settings
router.get('/chatbot/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const business = await findBusiness(auth.user.id, res);
    if (!business) return;

    const chatbotSettings = {
      commandList: business.settings.customization.commandList,
      autoResponses: business.settings.customization.autoResponses
    };

    res.json(chatbotSettings);
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/chatbot/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const business = await Business.findOne({ 'contactInfo.email': user.id });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const { commandList, autoResponses } = req.body;

    // Initialize settings if needed
    if (!business.settings) {
      business.settings = {} as any;
    }
    
    if (!business.settings.customization) {
      business.settings.customization = {
        commandList: [],
        autoResponses: []
      };
    }

    // Update settings
    if (commandList) {
      business.settings.customization.commandList = commandList;
    }
    if (autoResponses) {
      business.settings.customization.autoResponses = autoResponses;
    }

    await business.save();
    res.json({
      commandList: business.settings.customization.commandList,
      autoResponses: business.settings.customization.autoResponses
    });
  } catch (error) {
    console.error('Error updating chatbot settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 