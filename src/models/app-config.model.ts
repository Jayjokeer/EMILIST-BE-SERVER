import mongoose, { Schema } from "mongoose";

const vatAmount = 7.5;

const AppConfigSchema = new Schema({
    vat: {type: Number, default : vatAmount},
  });

export default mongoose.model('AppConfig', AppConfigSchema);