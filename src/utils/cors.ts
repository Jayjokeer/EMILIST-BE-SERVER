import { CorsOptions } from "cors";
import { getAllowedFrontendOrigin } from "./frontend-origin";

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requests without Origin are not browser CORS requests (for example,
    // server-to-server calls, mobile clients, health checks and Swagger).
    if (!origin) {
      callback(null, false);
      return;
    }

    const allowedOrigin = getAllowedFrontendOrigin(origin);
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

