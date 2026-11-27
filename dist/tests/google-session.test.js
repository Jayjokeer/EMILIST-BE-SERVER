"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const frontend_origin_1 = require("../src/utils/frontend-origin");
const auth_session_1 = require("../src/utils/auth-session");
const cors_1 = require("../src/utils/cors");
(0, node_test_1.default)("Google OAuth only redirects to approved frontend origins", () => {
    strict_1.default.equal((0, frontend_origin_1.getAllowedFrontendOrigin)("https://emilist-v2.vercel.app/dashboard"), "https://emilist-v2.vercel.app");
    strict_1.default.equal((0, frontend_origin_1.getAllowedFrontendOrigin)("http://localhost:3000/login"), "http://localhost:3000");
    strict_1.default.equal((0, frontend_origin_1.getAllowedFrontendOrigin)("https://evil.example"), undefined);
    strict_1.default.equal((0, frontend_origin_1.resolveFrontendOrigin)("https://evil.example"), "https://emilist-v2.vercel.app");
});
(0, node_test_1.default)("Google session cookie is protected for cross-site use", () => {
    strict_1.default.equal(auth_session_1.authCookieOptions.httpOnly, true);
    strict_1.default.equal(auth_session_1.authCookieOptions.secure, true);
    strict_1.default.equal(auth_session_1.authCookieOptions.sameSite, "none");
    strict_1.default.equal(auth_session_1.authCookieOptions.path, "/");
});
(0, node_test_1.default)("credentialed CORS reflects an approved origin and rejects other origins", async () => {
    strict_1.default.equal(cors_1.corsOptions.credentials, true);
    strict_1.default.equal(typeof cors_1.corsOptions.origin, "function");
    const checkOrigin = (origin) => new Promise((resolve, reject) => {
        if (typeof cors_1.corsOptions.origin !== "function")
            return reject(new Error("Missing CORS origin callback"));
        cors_1.corsOptions.origin(origin, (error, allowedOrigin) => {
            if (error)
                reject(error);
            else
                resolve(allowedOrigin);
        });
    });
    strict_1.default.equal(await checkOrigin("https://emilist-v2.vercel.app"), "https://emilist-v2.vercel.app");
    strict_1.default.equal(await checkOrigin("http://localhost:3000"), "http://localhost:3000");
    await strict_1.default.rejects(() => checkOrigin("https://evil.example"));
});
