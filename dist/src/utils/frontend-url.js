"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFrontendUrl = void 0;
const parseFrontendUrl = (baseUrl) => {
    const configuredUrl = String(baseUrl || "").trim();
    if (!configuredUrl) {
        throw new Error("Frontend URL is not configured. Set FRONTEND_URL or FRONTEND_ADMIN_URL as appropriate");
    }
    let url;
    try {
        url = new URL(configuredUrl);
    }
    catch {
        throw new Error(`Frontend URL is invalid: ${configuredUrl}`);
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("Frontend URL must use http or https");
    }
    return url;
};
const buildFrontendUrl = (baseUrl, options = {}) => {
    const url = parseFrontendUrl(baseUrl);
    if (options.path) {
        const requestedPath = options.path.startsWith("/")
            ? options.path
            : `/${options.path}`;
        const basePath = options.replacePath ? "" : url.pathname.replace(/\/+$/, "");
        url.pathname = `${basePath}${requestedPath}`;
    }
    for (const [key, value] of Object.entries(options.query || {})) {
        url.searchParams.set(key, value);
    }
    return url.toString();
};
exports.buildFrontendUrl = buildFrontendUrl;
