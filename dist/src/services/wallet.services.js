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
exports.fundWallet = exports.findUserWallet = exports.createWallet = void 0;
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const createWallet = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield wallet_model_1.default.create(data);
});
exports.createWallet = createWallet;
const findUserWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield wallet_model_1.default.findOne({ userId: userId });
});
exports.findUserWallet = findUserWallet;
const fundWallet = (amount, userId) => __awaiter(void 0, void 0, void 0, function* () {
});
exports.fundWallet = fundWallet;
