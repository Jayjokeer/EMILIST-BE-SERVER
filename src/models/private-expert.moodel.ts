import mongoose, { Document, Schema } from 'mongoose';
import { IExpert } from '../interfaces/private-expert';



  const ExpertSchema: Schema = new mongoose.Schema(
    {
      fullName: { type: String },
      phoneNumber: {type: String},
      email: {type: String},
      typeOfExpert: {type: String},
      details: {type: String},
    },
    { timestamps: true }
  );
  
  export default mongoose.model<IExpert>("Expert", ExpertSchema);