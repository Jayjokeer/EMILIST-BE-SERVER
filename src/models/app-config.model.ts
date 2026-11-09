import mongoose, { Schema } from "mongoose";

const vatAmount = 7.5;
const costPerClick = 1;
const costPerDay = 5;
const certificateVerificationPrice= 10;
const userVerificationPrice= 20;
const businessVerificationPrice= 30;


const AppConfigSchema = new Schema({
    vat: {type: Number, default : vatAmount},
    platformCommissionPercent: {type: Number, min: 0, max: 100, default: 5},
    withdrawalCurrency: {type: String, default: "NGN"},
    minimumWithdrawalAmount: {type: Number, min: 0, default: 2000},
    maximumWithdrawalAmount: {type: Number, min: 0, default: 5000000},
    minimumDepositAmount: {type: Number, min: 0, default: 1000},
    costPerClick: {type: Number, default : costPerClick },
    costPerDay: {type: Number, default : costPerDay },
    certificateVerificationPrice: {type: Number, default : certificateVerificationPrice },
    userVerificationPrice: {type: Number, default : userVerificationPrice },
    businessVerificationPrice: {type: Number, default : businessVerificationPrice },
    email: {type: String},
    spotlightExpertUserId: {type: Schema.Types.ObjectId, ref: "Users"},
    spotlightMerchantUserId: {type: Schema.Types.ObjectId, ref: "Users"},
    spotlightPublishedAt: {type: Date},
    spotlightPublishedBy: {type: Schema.Types.ObjectId, ref: "Admin"},
  }, { timestamps: true });

export default mongoose.model('AppConfig', AppConfigSchema);
