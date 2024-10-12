import mongoose from 'mongoose';
import { config } from '../src/utils/config';

const mongoUri = String(config.mongo)
export const connectDB = async () => {
    try {
      await mongoose.connect(mongoUri);
      console.log('Database connected');
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  };