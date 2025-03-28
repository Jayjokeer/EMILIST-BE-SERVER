import { v4 as uuidv4 } from 'uuid';
import {totp}  from "otplib";
import { config } from './config';
import * as transactionService from "../services/transaction.service";
const secret = config.otpSecret || "";
export const generateShortUUID = (): string => {
    return uuidv4().slice(0, 6);
  };
  const AddMinutesToDate = ( time: any, minutes: any ) => {
    return new Date(time.getTime() + minutes * 60000);
  };
  export const generateOTPData = ( userId: string ) => {
    
    const period = 60;
     const digits = 5;
     const options = {
      step: period,
      digits,
      epoch: Date.now(),
    };
    totp.options = options
     const otp = totp.generate(secret + String(userId));
     let time = new Date();
     const otpCreatedAt = time;
     const minutes = 10
     const otpExpiryTime = AddMinutesToDate(time, minutes );
     return { otp, otpCreatedAt, otpExpiryTime };
  };
  export const calculatePercentage  =(currentValue: number, targetValue: number) =>{
    if (targetValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    const percentage = (currentValue / targetValue) * 100;
    return Math.min(Math.max(percentage, 0), 100); 
  };
  
  export const calculateVat = async( amount: number)=>{
    const data = await transactionService.getVat();
    const vatRate = data!.vat / 100;
    const vatAmount = amount * vatRate;
    return {
      vatAmount,
      totalAmount:  parseFloat((amount + vatAmount).toFixed(2))
    }; 
    };
  export const calculateNextMaintenanceDate = (startDate: Date, frequency: string): Date => {
      const nextDate = new Date(startDate);
      switch (frequency) {
        case 'Weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'Monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'Quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        default:
          throw new Error(`Frequency ${frequency} not supported.`);
      }
      return nextDate;
    };