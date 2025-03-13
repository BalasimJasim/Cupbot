import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Business from '../models/Business';
import fs from 'fs';
import path from 'path';

dotenv.config();

const initializeBusiness = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Read business configuration
    const configPath = path.join(__dirname, '../config/business-config.json');
    console.log('Reading business configuration from:', configPath);
    
    if (!fs.existsSync(configPath)) {
      console.error('Business configuration file not found!');
      console.log('Please create a business-config.json file in the config directory.');
      process.exit(1);
    }

    const businessConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('Business configuration loaded successfully');

    // Check if a business already exists
    const existingBusiness = await Business.findOne();
    if (!existingBusiness) {
      const business = await Business.create(businessConfig);
      console.log('Business created successfully:', business.name);
      console.log('Services configured:', business.services.length);
      console.log('Working hours configured for:', business.workingHours.length, 'days');
    } else {
      console.log('Updating existing business:', existingBusiness.name);
      await Business.findByIdAndUpdate(existingBusiness._id, businessConfig);
      console.log('Business configuration updated successfully');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('\nSetup completed successfully! You can now start the bot server.');
  } catch (error) {
    console.error('Error initializing business:', error);
    process.exit(1);
  }
};

initializeBusiness(); 