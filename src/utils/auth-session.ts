import { CookieOptions } from "express";

export const AUTH_COOKIE_NAME = "sessionId";
export const AUTH_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: AUTH_SESSION_MAX_AGE,
};

export const authCookieClearOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};

