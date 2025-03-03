import mongoose, { Schema } from "mongoose";

const vatAmount = 7.5;
const costPerClick = 1;

const AppConfigSchema = new Schema({
    vat: {type: Number, default : vatAmount},
    costPerClick: {type: Number, default : costPerClick }
  });

export default mongoose.model('AppConfig', AppConfigSchema);