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
const target_enum_1 = require("../enums/target.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const targetSchema = new mongoose_1.default.Schema({
    duration: { type: String, enum: target_enum_1.TargetEnum },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Users", required: true },
    job: { type: Number, default: 0 },
    invites: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    currency: { type: String, enum: transaction_enum_1.WalletEnum }
}, { timestamps: true });
exports.default = mongoose_1.default.model("Target", targetSchema);
