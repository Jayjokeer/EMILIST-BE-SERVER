"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const business_enum_1 = require("../enums/business.enum");
const ServicesRenderedSchema = new mongoose_1.Schema({
    name: {
        type: String,
    },
    status: {
        type: String,
    },
});
const MemberShipSchema = new mongoose_1.Schema({
    organisation: { type: String },
    positionHeld: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isMembershipExpire: { type: Boolean, default: true }
});
const CertificationSchema = new mongoose_1.Schema({
    certificate: { type: String },
    issuingOrganisation: { type: String },
    verificationNumber: { type: String },
    issuingDate: { type: Date },
    expiringDate: { type: Date },
    isCertificateExpire: { type: Boolean, default: true }
});
const InsuranceSchema = new mongoose_1.Schema({
    issuingOrganisation: { type: String },
    coverage: { type: String },
    description: { type: String },
});
const BusinessImagesSchema = new mongoose_1.Schema({
    imageUrl: { type: String },
});
const businessSchema = new mongoose_1.default.Schema({
    services: [{ type: String }],
    firstName: { type: String },
    lastName: { type: String },
    languages: [{ type: String }],
    address: { type: String },
    phoneNumber: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    bio: { type: String },
    profileImage: { type: String },
    renderedServices: [{ type: ServicesRenderedSchema }],
    certification: [{ type: CertificationSchema }],
    membership: [{ type: MemberShipSchema }],
    insurance: [{ type: InsuranceSchema }],
    coverageArea: [{ type: String }],
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Users' },
    businessName: { type: String },
    yearFounded: { type: String },
    numberOfEmployee: { type: Number },
    businessAddress: { type: String },
    businessCity: { type: String },
    businessState: { type: String },
    businessCountry: { type: String },
    startingPrice: { type: Number },
    noticePeriod: { type: String },
    currency: { type: String },
    businessDescription: { type: String },
    businessImages: [{ type: BusinessImagesSchema }],
    expertType: { type: String, enum: business_enum_1.ExpertTypeEnum, default: business_enum_1.ExpertTypeEnum.verified },
    reviews: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Review' }],
    clicks: {
        users: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Users' }],
        clickCount: { type: Number, default: 0 }
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Business', businessSchema);
