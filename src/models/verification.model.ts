import mongoose, { Schema } from "mongoose";
import { OrderPaymentStatus } from "../enums/order.enum";
import { QuoteStatusEnum } from "../enums/jobs.enum";



const VerificationSchema = new Schema({
    businessId: {type: Schema.Types.ObjectId , ref: 'Business'},
    userId: {type: Schema.Types.ObjectId, ref: 'User' },
    certificateId: {type: String},
    status: {type: String, enum: QuoteStatusEnum,default: QuoteStatusEnum.pending},
    paymentStatus: {type: String, enum: OrderPaymentStatus, default: OrderPaymentStatus.unpaid}
  });

export default mongoose.model('Verifications', VerificationSchema);