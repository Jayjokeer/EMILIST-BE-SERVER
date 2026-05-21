"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllVerifications = exports.findById = exports.updateVerification = exports.createVerification = void 0;
const verification_model_1 = __importDefault(require("../models/verification.model"));
const createVerification = async (data) => {
    return await verification_model_1.default.create(data);
};
exports.createVerification = createVerification;
const updateVerification = async (id, data) => {
    return await verification_model_1.default.updateOne({ _id: id }, {
        $set: {
            'paymentStatus': data.paymentStatus
        },
    });
};
exports.updateVerification = updateVerification;
const findById = async (id) => {
    return await verification_model_1.default.findById(id);
};
exports.findById = findById;
const fetchAllVerifications = async (page, limit) => {
    const skip = (page - 1) * limit;
    const [verifications, total] = await Promise.all([
        verification_model_1.default.find()
            .populate("businessId", "businessName")
            .populate("userId", "fullName email")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit),
        verification_model_1.default.countDocuments(),
    ]);
    return {
        verifications,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
    };
};
exports.fetchAllVerifications = fetchAllVerifications;
