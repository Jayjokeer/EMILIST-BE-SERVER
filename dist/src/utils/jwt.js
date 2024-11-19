"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.generateJWTwithExpiryDate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("../errors/error");
const generateJWTwithExpiryDate = (payload) => {
    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
    const userJWT = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { exp }), process.env.JWT_SECRET);
    return userJWT;
};
exports.generateJWTwithExpiryDate = generateJWTwithExpiryDate;
const verifyJWT = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return payload;
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new error_1.BadRequestError("Kindly log in!");
        }
        else {
            throw new error_1.BadRequestError("This token is invalid");
        }
    }
};
exports.verifyJWT = verifyJWT;
