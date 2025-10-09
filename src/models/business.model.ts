import mongoose, { Document, Schema } from 'mongoose';
import { IBusiness } from '../interfaces/business.interface';
import { ExpertTypeEnum } from '../enums/business.enum';
const ServicesRenderedSchema = new Schema({
    name: {
      type: String,
    },
    status: {
      type: String,
    },
  });
  const MemberShipSchema = new Schema({
    
    organisation: {type: String},
    positionHeld: {type: String},
    startDate: {type: Date},
    endDate: {type: Date},
    isMembershipExpire: {type: Boolean, default: true}
      
  })
  const CertificationSchema = new Schema({
    certificate: {type: String},
    issuingOrganisation: {type: String},
    verificationNumber: {type: String},
    issuingDate: {type: Date},
    expiringDate: {type: Date},
    isCertificateExpire: {type: Boolean, default: true },
    isVerified: {type: Boolean, default: false}
  })
  const InsuranceSchema = new Schema({
    issuingOrganisation: {type: String},
    coverage: {type: String},
    description: {type: String},
  })
  const BusinessImagesSchema = new Schema({
    imageUrl: {type: String},
  })
const businessSchema: Schema = new mongoose.Schema(
  {
    services: [{ type: String}],
    firstName: { type: String },
    lastName: { type: String },
    languages: [{ type: String}],
    address: { type: String },
    phoneNumber: { type: String },
    city: { type: String },
    state: { type: String},
    country: {type: String},
    bio: {type: String},
    profileImage: {type: String},
    renderedServices: [{type: ServicesRenderedSchema }],
    certification: [{type: CertificationSchema}],
    membership: [{type: MemberShipSchema }],
    insurance: [{ type: InsuranceSchema}],
    coverageArea: [{type: String}],
    userId: {type: Schema.Types.ObjectId, ref: 'Users'},
    businessName: {type: String},
    yearFounded: {type: String},
    numberOfEmployee: {type: Number},
    businessAddress: {type: String},
    businessCity: {type: String},
    businessState: {type: String},
    businessCountry: {type: String},
    startingPrice: {type: Number},
    noticePeriod: {type: String},
    currency: {type: String},
    businessDescription: {type: String},
    businessImages: [{type:  BusinessImagesSchema }],
    expertType: {type: String, enum: ExpertTypeEnum, default: ExpertTypeEnum.verified},
    reviews: [{type:  Schema.Types.ObjectId, ref: 'Review'}],
    clicks: {
      users: [{type: Schema.Types.ObjectId, ref: 'Users'}],
      clickCount: {type: Number, default: 0}
     },
     isVerified: {type: Boolean, default: false},
  },
  { timestamps: true }

);

export default mongoose.model<IBusiness>('Business', businessSchema);