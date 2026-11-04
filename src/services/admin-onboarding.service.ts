import { authenticator } from "otplib";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { comparePassword } from "../utils/hashing";
import { BadRequestError } from "../errors/error";

export const ADMIN_INVITATION_TTL_MS = 48 * 60 * 60 * 1000;
export const PASSWORD_HISTORY_LIMIT = 5;

export const assertStrongAdminPassword = (password: string, confirmation?: string) => {
  if (confirmation !== undefined && password !== confirmation) {
    throw new BadRequestError("Passwords do not match");
  }

  const failures: string[] = [];
  if (password.length < 12) failures.push("at least 12 characters");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) failures.push("mixed case");
  if (!/\d/.test(password)) failures.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) failures.push("a symbol");

  if (failures.length) {
    throw new BadRequestError(`Password must contain ${failures.join(", ")}`);
  }
};

export const assertPasswordNotReused = async (
  password: string,
  currentPassword?: string,
  passwordHistory: string[] = [],
) => {
  const recentPasswords = [currentPassword, ...passwordHistory]
    .filter((value): value is string => Boolean(value))
    .slice(0, PASSWORD_HISTORY_LIMIT);

  for (const recentPassword of recentPasswords) {
    if (await comparePassword(password, recentPassword)) {
      throw new BadRequestError("You cannot re-use a recent password");
    }
  }
};

export const createAuthenticatorEnrollment = (email: string, existingSecret?: string) => {
  const secret = existingSecret || authenticator.generateSecret();
  return {
    secret,
    otpauthUri: authenticator.keyuri(email, "Emilist Admin", secret),
  };
};

export const verifyAuthenticatorCode = (secret: string, code: string) => {
  authenticator.options = { step: 30, window: 1 };
  return authenticator.verify({ token: code, secret });
};

const mfaEncryptionKey = () =>
  createHash("sha256").update(process.env.JWT_SECRET || "").digest();

export const encryptMfaSecret = (secret: string) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required to protect MFA secrets");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", mfaEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(":");
};

export const decryptMfaSecret = (value: string) => {
  if (!value.startsWith("v1:")) return value;
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required to read MFA secrets");
  const [, iv, authTag, encrypted] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", mfaEncryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};
