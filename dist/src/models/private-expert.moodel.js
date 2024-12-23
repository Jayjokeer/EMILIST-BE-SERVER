"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ExpertSchema = new mongoose_1.default.Schema({
    fullName: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    typeOfExpert: { type: String },
    details: { type: String },
    fileUrl: { type: String },
    location: { type: String },
    availability: [{
            time: { type: String },
            date: { type: Date },
        }]
}, { timestamps: true });
exports.default = mongoose_1.default.model("Expert", ExpertSchema);
