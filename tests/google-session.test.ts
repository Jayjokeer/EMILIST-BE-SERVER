import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedFrontendOrigin,
  resolveFrontendOrigin,
} from "../src/utils/frontend-origin";
import { authCookieOptions } from "../src/utils/auth-session";
import { corsOptions } from "../src/utils/cors";

test("Google OAuth only redirects to approved frontend origins", () => {
  assert.equal(
    getAllowedFrontendOrigin("https://emilist-v2.vercel.app/dashboard"),
    "https://emilist-v2.vercel.app",
  );
  assert.equal(
    getAllowedFrontendOrigin("http://localhost:3000/login"),
    "http://localhost:3000",
  );
  assert.equal(getAllowedFrontendOrigin("https://evil.example"), undefined);
  assert.equal(
    resolveFrontendOrigin("https://evil.example"),
    "https://emilist-v2.vercel.app",
  );
});

test("Google session cookie is protected for cross-site use", () => {
  assert.equal(authCookieOptions.httpOnly, true);
  assert.equal(authCookieOptions.secure, true);
  assert.equal(authCookieOptions.sameSite, "none");
  assert.equal(authCookieOptions.path, "/");
});

test("credentialed CORS reflects an approved origin and rejects other origins", async () => {
  assert.equal(corsOptions.credentials, true);
  assert.equal(typeof corsOptions.origin, "function");

  const checkOrigin = (origin: string) => new Promise<unknown>(
    (resolve, reject) => {
      if (typeof corsOptions.origin !== "function") return reject(new Error("Missing CORS origin callback"));
      corsOptions.origin(origin, (error, allowedOrigin) => {
        if (error) reject(error);
        else resolve(allowedOrigin);
      });
    },
  );

  assert.equal(
    await checkOrigin("https://emilist-v2.vercel.app"),
    "https://emilist-v2.vercel.app",
  );
  assert.equal(await checkOrigin("http://localhost:3000"), "http://localhost:3000");
  await assert.rejects(() => checkOrigin("https://evil.example"));
});
