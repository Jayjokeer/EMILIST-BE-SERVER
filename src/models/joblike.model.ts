import mongoose, { Schema, model } from 'mongoose';


const jobLikeSchema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  }, { timestamps: true });
  

  export default mongoose.model('JobLike', jobLikeSchema);