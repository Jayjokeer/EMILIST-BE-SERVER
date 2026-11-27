"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFrontendOrigin = exports.getAllowedFrontendOrigin = exports.allowedFrontendOrigins = exports.LOCAL_FRONTEND_ORIGIN = exports.PRODUCTION_FRONTEND_ORIGIN = void 0;
exports.PRODUCTION_FRONTEND_ORIGIN = "https://emilist-v2.vercel.app";
exports.LOCAL_FRONTEND_ORIGIN = "http://localhost:3000";
exports.allowedFrontendOrigins = new Set([
    exports.PRODUCTION_FRONTEND_ORIGIN,
    exports.LOCAL_FRONTEND_ORIGIN,
]);
const asOrigin = (value) => {
    if (typeof value !== "string" || !value.trim())
        return undefined;
    try {
        return new URL(value.trim()).origin;
    }
    catch {
        return undefined;
    }
};
const getAllowedFrontendOrigin = (value) => {
    const origin = asOrigin(value);
    return origin && exports.allowedFrontendOrigins.has(origin) ? origin : undefined;
};
exports.getAllowedFrontendOrigin = getAllowedFrontendOrigin;
const resolveFrontendOrigin = (value) => (0, exports.getAllowedFrontendOrigin)(value) || exports.PRODUCTION_FRONTEND_ORIGIN;
exports.resolveFrontendOrigin = resolveFrontendOrigin;
