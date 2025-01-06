import { TargetEnum } from "../enums/target.enum";
import { WalletEnum } from "../enums/transaction.enum";

export interface ITarget {
    job: number; 
    amount: number;
    referrals: number;
    invites: number;
    userId: any;
    currency: WalletEnum;
    duration: TargetEnum
  }
