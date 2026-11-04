"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptMfaSecret = exports.encryptMfaSecret = exports.verifyAuthenticatorCode = exports.createAuthenticatorEnrollment = exports.assertPasswordNotReused = exports.assertStrongAdminPassword = exports.PASSWORD_HISTORY_LIMIT = exports.ADMIN_INVITATION_TTL_MS = void 0;
const otplib_1 = require("otplib");
const crypto_1 = require("crypto");
const hashing_1 = require("../utils/hashing");
const error_1 = require("../errors/error");
exports.ADMIN_INVITATION_TTL_MS = 48 * 60 * 60 * 1000;
exports.PASSWORD_HISTORY_LIMIT = 5;
const assertStrongAdminPassword = (password, confirmation) => {
    if (confirmation !== undefined && password !== confirmation) {
        throw new error_1.BadRequestError("Passwords do not match");
    }
    const failures = [];
    if (password.length < 12)
        failures.push("at least 12 characters");
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password))
        failures.push("mixed case");
    if (!/\d/.test(password))
        failures.push("a number");
    if (!/[^A-Za-z0-9]/.test(password))
        failures.push("a symbol");
    if (failures.length) {
        throw new error_1.BadRequestError(`Password must contain ${failures.join(", ")}`);
    }
};
exports.assertStrongAdminPassword = assertStrongAdminPassword;
const assertPasswordNotReused = async (password, currentPassword, passwordHistory = []) => {
    const recentPasswords = [currentPassword, ...passwordHistory]
        .filter((value) => Boolean(value))
        .slice(0, exports.PASSWORD_HISTORY_LIMIT);
    for (const recentPassword of recentPasswords) {
        if (await (0, hashing_1.comparePassword)(password, recentPassword)) {
            throw new error_1.BadRequestError("You cannot re-use a recent password");
        }
    }
};
exports.assertPasswordNotReused = assertPasswordNotReused;
const createAuthenticatorEnrollment = (email, existingSecret) => {
    const secret = existingSecret || otplib_1.authenticator.generateSecret();
    return {
        secret,
        otpauthUri: otplib_1.authenticator.keyuri(email, "Emilist Admin", secret),
    };
};
exports.createAuthenticatorEnrollment = createAuthenticatorEnrollment;
const verifyAuthenticatorCode = (secret, code) => {
    otplib_1.authenticator.options = { step: 30, window: 1 };
    return otplib_1.authenticator.verify({ token: code, secret });
};
exports.verifyAuthenticatorCode = verifyAuthenticatorCode;
const mfaEncryptionKey = () => (0, crypto_1.createHash)("sha256").update(process.env.JWT_SECRET || "").digest();
const encryptMfaSecret = (secret) => {
    if (!process.env.JWT_SECRET)
        throw new Error("JWT_SECRET is required to protect MFA secrets");
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)("aes-256-gcm", mfaEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(":");
};
exports.encryptMfaSecret = encryptMfaSecret;
const decryptMfaSecret = (value) => {
    if (!value.startsWith("v1:"))
        return value;
    if (!process.env.JWT_SECRET)
        throw new Error("JWT_SECRET is required to read MFA secrets");
    const [, iv, authTag, encrypted] = value.split(":");
    const decipher = (0, crypto_1.createDecipheriv)("aes-256-gcm", mfaEncryptionKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(authTag, "base64url"));
    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64url")),
        decipher.final(),
    ]).toString("utf8");
};
exports.decryptMfaSecret = decryptMfaSecret;
