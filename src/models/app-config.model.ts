import mongoose, { Schema } from "mongoose";

const vatAmount = 7.5;
const costPerClick = 1;
const costPerDay = 5;
const certificateVerificationPrice= 10;
const userVerificationPrice= 20;
const businessVerificationPrice= 30;


const AppConfigSchema = new Schema({
    vat: {type: Number, default : vatAmount},
    costPerClick: {type: Number, default : costPerClick },
    costPerDay: {type: Number, default : costPerDay },
    certificateVerificationPrice: {type: Number, default : certificateVerificationPrice },
    userVerificationPrice: {type: Number, default : userVerificationPrice },
    businessVerificationPrice: {type: Number, default : businessVerificationPrice },
    email: {type: String},
  });

export default mongoose.model('AppConfig', AppConfigSchema);