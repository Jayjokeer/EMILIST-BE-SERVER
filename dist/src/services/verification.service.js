"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllVerifications = exports.findById = exports.updateVerification = exports.createVerification = void 0;
const verification_model_1 = __importDefault(require("../models/verification.model"));
const createVerification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield verification_model_1.default.create(data);
});
exports.createVerification = createVerification;
const updateVerification = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield verification_model_1.default.updateOne({ _id: id }, {
        $set: {
            'paymentStatus': data.paymentStatus
        },
    });
});
exports.updateVerification = updateVerification;
const findById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield verification_model_1.default.findById(id);
});
exports.findById = findById;
const fetchAllVerifications = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const [verifications, total] = yield Promise.all([
        verification_model_1.default.find()
            .populate("businessId", "businessName")
            .populate("userId", "firstName lastName email")
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
        pageSize: limit,
    };
});
exports.fetchAllVerifications = fetchAllVerifications;
