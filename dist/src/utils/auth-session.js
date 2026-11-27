"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCookieClearOptions = exports.authCookieOptions = exports.AUTH_SESSION_MAX_AGE = exports.AUTH_COOKIE_NAME = void 0;
exports.AUTH_COOKIE_NAME = "sessionId";
exports.AUTH_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
exports.authCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: exports.AUTH_SESSION_MAX_AGE,
};
exports.authCookieClearOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};
