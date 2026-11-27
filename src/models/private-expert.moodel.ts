import mongoose, { Document, Schema } from 'mongoose';
import { IExpert } from '../interfaces/private-expert';
import { JobExpertLevel } from '../enums/jobs.enum';



  const ExpertSchema: Schema = new mongoose.Schema(
    {
      fullName: { type: String },
      phoneNumber: {type: String},
      email: {type: String},
      typeOfExpert: {type: String},
      level: { type: String, enum: JobExpertLevel, required: true },
      details: {type: String},
      fileUrl: {type: String},
      location: {type: String},
      availability: [{
        time: {type: String},
        date: {type: Date},
      }]
    },
    { timestamps: true }
  );
  
  export default mongoose.model<IExpert>("Expert", ExpertSchema);
