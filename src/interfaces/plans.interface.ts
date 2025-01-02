import { Schema } from "mongoose";

export interface IPerk {
    name: string; 
    limit: number; 
    used: number; 
  }
  
 export interface IPlan extends Document {
    name: string;
    price: number;
    duration: number; 
    perks:  IPerk[];
    isActive: boolean;
    offers: IOffers[];
  }
export interface IOffers {
    name: string; 
    value: string; 
    isActive: boolean; 
  }
  
 