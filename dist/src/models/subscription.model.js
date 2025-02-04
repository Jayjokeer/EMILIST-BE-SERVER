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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const PerkSchema = new mongoose_1.Schema({
    name: { type: String, enum: suscribtion_enum_1.SubscriptionPerksEnum },
    limit: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
});
const SubscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
        type: String,
        enum: suscribtion_enum_1.SubscriptionStatusEnum,
        default: suscribtion_enum_1.SubscriptionStatusEnum.active,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    perks: [PerkSchema],
    subscriptionPeriod: { type: String, enum: suscribtion_enum_1.SubscriptionPeriodEnum },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Subscription', SubscriptionSchema);
