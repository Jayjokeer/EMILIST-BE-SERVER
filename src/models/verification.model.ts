import mongoose, { Schema } from "mongoose";
import { OrderPaymentStatus } from "../enums/order.enum";
import { QuoteStatusEnum } from "../enums/jobs.enum";
import { VerificationEnum } from "../enums/user.enums";



const VerificationSchema = new Schema({
    businessId: {type: Schema.Types.ObjectId , ref: 'Business'},
    userId: {type: Schema.Types.ObjectId, ref: 'Users' },
    certificateId: {type: String},
    status: {type: String, enum: QuoteStatusEnum,default: QuoteStatusEnum.pending},
    paymentStatus: {type: String, enum: OrderPaymentStatus, default: OrderPaymentStatus.unpaid},
    type: {type: String, enum: VerificationEnum},
  },{
    timestamps: true
  });

export default mongoose.model('Verifications', VerificationSchema);