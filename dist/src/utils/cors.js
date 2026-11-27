"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const frontend_origin_1 = require("./frontend-origin");
exports.corsOptions = {
    origin(origin, callback) {
        // Requests without Origin are not browser CORS requests (for example,
        // server-to-server calls, mobile clients, health checks and Swagger).
        if (!origin) {
            callback(null, false);
            return;
        }
        const allowedOrigin = (0, frontend_origin_1.getAllowedFrontendOrigin)(origin);
        if (!allowedOrigin) {
            callback(new Error(`Origin ${origin} is not allowed by CORS`));
            return;
        }
        // Return the exact requesting origin. Never use "*" with credentials.
        callback(null, allowedOrigin);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};
