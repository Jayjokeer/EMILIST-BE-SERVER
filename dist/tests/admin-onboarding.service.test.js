"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const otplib_1 = require("otplib");
const hashing_1 = require("../src/utils/hashing");
const admin_service_1 = require("../src/services/admin.service");
const admin_onboarding_service_1 = require("../src/services/admin-onboarding.service");
const frontend_url_1 = require("../src/utils/frontend-url");
(0, node_test_1.default)('admin passwords must satisfy every rule shown by onboarding', () => {
    strict_1.default.throws(() => (0, admin_onboarding_service_1.assertStrongAdminPassword)('short'), /at least 12 characters/);
    strict_1.default.throws(() => (0, admin_onboarding_service_1.assertStrongAdminPassword)('alllowercase1!'), /mixed case/);
    strict_1.default.throws(() => (0, admin_onboarding_service_1.assertStrongAdminPassword)('NoNumberHere!'), /a number/);
    strict_1.default.throws(() => (0, admin_onboarding_service_1.assertStrongAdminPassword)('NoSymbolHere1'), /a symbol/);
    strict_1.default.throws(() => (0, admin_onboarding_service_1.assertStrongAdminPassword)('StrongPassword1!', 'DifferentPassword1!'), /do not match/);
    strict_1.default.doesNotThrow(() => (0, admin_onboarding_service_1.assertStrongAdminPassword)('StrongPassword1!', 'StrongPassword1!'));
});
(0, node_test_1.default)('a recent admin password cannot be reused', async () => {
    const recent = await (0, hashing_1.hashPassword)('StrongPassword1!');
    await strict_1.default.rejects((0, admin_onboarding_service_1.assertPasswordNotReused)('StrongPassword1!', undefined, [recent]), /cannot re-use a recent password/);
    await strict_1.default.doesNotReject((0, admin_onboarding_service_1.assertPasswordNotReused)('DifferentPassword2!', undefined, [recent]));
});
(0, node_test_1.default)('authenticator enrollment returns a reusable secret and Emilist URI', () => {
    const first = (0, admin_onboarding_service_1.createAuthenticatorEnrollment)('jane@emilist.com');
    const resumed = (0, admin_onboarding_service_1.createAuthenticatorEnrollment)('jane@emilist.com', first.secret);
    strict_1.default.equal(resumed.secret, first.secret);
    strict_1.default.match(resumed.otpauthUri, /^otpauth:\/\/totp\/Emilist%20Admin:/);
    strict_1.default.match(resumed.otpauthUri, /jane%40emilist.com/);
});
(0, node_test_1.default)('authenticator verification accepts the current six-digit code', () => {
    const enrollment = (0, admin_onboarding_service_1.createAuthenticatorEnrollment)('jane@emilist.com');
    const code = otplib_1.authenticator.generate(enrollment.secret);
    strict_1.default.equal((0, admin_onboarding_service_1.verifyAuthenticatorCode)(enrollment.secret, code), true);
    strict_1.default.equal((0, admin_onboarding_service_1.verifyAuthenticatorCode)(enrollment.secret, '000000') || code === '000000', code === '000000');
});
(0, node_test_1.default)('MFA secrets are encrypted at rest and can be decrypted for verification', () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-only-jwt-secret';
    try {
        const encrypted = (0, admin_onboarding_service_1.encryptMfaSecret)('TOPSECRET');
        strict_1.default.notEqual(encrypted, 'TOPSECRET');
        strict_1.default.match(encrypted, /^v1:/);
        strict_1.default.equal((0, admin_onboarding_service_1.decryptMfaSecret)(encrypted), 'TOPSECRET');
    }
    finally {
        if (previousSecret === undefined)
            delete process.env.JWT_SECRET;
        else
            process.env.JWT_SECRET = previousSecret;
    }
});
(0, node_test_1.default)('password reset links store only a deterministic hash of an opaque token', () => {
    const reset = (0, admin_service_1.createPasswordResetToken)();
    strict_1.default.notEqual(reset.token, reset.tokenHash);
    strict_1.default.equal((0, admin_service_1.hashInvitationToken)(reset.token), reset.tokenHash);
    strict_1.default.equal(reset.tokenHash.length, 64);
});
(0, node_test_1.default)('admin invitation links use the configured frontend and safely encode the token', () => {
    strict_1.default.equal((0, frontend_url_1.buildFrontendUrl)('https://emilist-admin-v2-l28s.vercel.app/login', {
        path: '/accept-invite',
        replacePath: true,
        query: {
            token: 'token with + and /',
            fullName: 'Jane Doe',
            email: 'jane@example.com',
            role: 'Support Agent',
            invitedBy: 'Super Admin',
        },
    }), 'https://emilist-admin-v2-l28s.vercel.app/accept-invite?token=token+with+%2B+and+%2F&fullName=Jane+Doe&email=jane%40example.com&role=Support+Agent&invitedBy=Super+Admin');
});
(0, node_test_1.default)('frontend links preserve existing queries and append the requested path', () => {
    strict_1.default.equal((0, frontend_url_1.buildFrontendUrl)('https://emilist-v2.vercel.app/admin?source=email', {
        path: '/reset-password',
        query: { token: 'abc' },
    }), 'https://emilist-v2.vercel.app/admin/reset-password?source=email&token=abc');
});
(0, node_test_1.default)('frontend link generation rejects missing or unsafe configuration', () => {
    strict_1.default.throws(() => (0, frontend_url_1.buildFrontendUrl)(undefined), /FRONTEND_ADMIN_URL/);
    strict_1.default.throws(() => (0, frontend_url_1.buildFrontendUrl)('javascript:alert(1)'), /must use http or https/);
});
