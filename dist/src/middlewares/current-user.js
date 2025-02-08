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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.userAuth = void 0;
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = require("../utils/jwt");
const error_1 = require("../errors/error");
const authService = __importStar(require("../services/auth.service"));
const user_enums_1 = require("../enums/user.enums");
const userAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Kindly login" });
        return;
    }
    try {
        const decode = (0, jwt_1.verifyJWT)(token);
        if (!decode || !decode.email) {
            throw new error_1.UnauthorizedError("Authentication Failure");
        }
        const user = yield authService.findUserByEmail(decode.email.toLowerCase());
        if (!user) {
            throw new error_1.UnauthorizedError("No user found");
        }
        if (!user.isEmailVerified) {
            throw new error_1.UnauthorizedError("Access Denied! Your account is disabled, please contact admin.");
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Auth Error:", error);
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            message: error instanceof error_1.UnauthorizedError ? error.message : "Authentication Failure",
        });
        return;
    }
});
exports.userAuth = userAuth;
const adminAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Kindly login" });
        return;
    }
    try {
        const decode = (0, jwt_1.verifyJWT)(token);
        if (!decode || !decode.email) {
            throw new error_1.UnauthorizedError("Authentication Failure");
        }
        const user = yield authService.findUserByEmail(decode.email.toLowerCase());
        if (!user) {
            throw new error_1.UnauthorizedError("No user found");
        }
        if (user.role !== user_enums_1.UserRolesEnum.admin) {
            throw new error_1.UnauthorizedError("Admin access only");
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Auth Error:", error);
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            message: error instanceof error_1.UnauthorizedError ? error.message : "Authentication Failure",
        });
        return;
    }
});
exports.adminAuth = adminAuth;
