import { Document, Types } from 'mongoose';

interface IServicesRendered {
  name?: string;
  status?: string;
}

interface IMembership {
  organisation?: string;
  positionHeld?: string;
  startDate?: Date;
  endDate?: Date;
  isMembershipExpire?: boolean;
}

interface ICertification {
  certificate?: string;
  issuingOrganisation?: string;
  verificationNumber?: string;
  issuingDate?: Date;
  expiringDate?: Date;
  isCertificateExpire?: boolean;
}

interface IInsurance {
  issuingOrganisation?: string;
  coverage?: string;
  description?: Date;
}

export interface IBusiness extends Document {
  services?: string[];
  firstName?: string;
  lastName?: string;
  languages?: string[];
  address?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  profileImage?: string;
  renderedServices?: IServicesRendered[];
  certification?: ICertification[];
  membership?: IMembership[];
  insurance?: IInsurance[];
  coverageArea?: string[];
  userId?: Types.ObjectId;
  businessName?:string;
  yearFounded?: string;
  numberOfEmployee?: number;
  businessAddress?:string;
  businessCity?: string;
  businessState?: string;
  businessCountry?: string;
  startingPrice?: number;
  noticePeriod?: string;
  businessDescription?: string;
  businessImages?: any ;
}

export default IBusiness;
