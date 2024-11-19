"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const error_1 = __importDefault(require("./error"));
const handleMongoDBErrors = (err) => {
    if (err.code === 11000) {
        const message = `Duplicate field value: ${Object.values(err.keyValue).join(', ')}`;
        return new error_1.default(message, 400);
    }
    return err;
};
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => next(err));
    };
};
exports.catchAsync = catchAsync;
const globalErrorHandler = (err, req, res, next) => {
    if (err.name === 'MongoError' || err.statusCode === 11000) {
        err = handleMongoDBErrors(err);
    }
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
        code: err.statusCode,
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.default = globalErrorHandler;
