export const PRODUCTION_FRONTEND_ORIGIN = "https://emilist-v2.vercel.app";
export const LOCAL_FRONTEND_ORIGIN = "http://localhost:3000";

export const allowedFrontendOrigins = new Set([
  PRODUCTION_FRONTEND_ORIGIN,
  LOCAL_FRONTEND_ORIGIN,
]);

const asOrigin = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return undefined;
  }
};

export const getAllowedFrontendOrigin = (
  value: unknown,
): string | undefined => {
  const origin = asOrigin(value);
  return origin && allowedFrontendOrigins.has(origin) ? origin : undefined;
};

export const resolveFrontendOrigin = (value: unknown): string =>
  getAllowedFrontendOrigin(value) || PRODUCTION_FRONTEND_ORIGIN;

