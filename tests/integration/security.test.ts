/* ============================================================================
 * Integration tests: security
 * Helmet headers, CORS and the login rate limit. In its own file because each
 * test file runs separately, so the failed logins of other files do not count.
 * ========================================================================== */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { startTestDB, clearTestDB, stopTestDB } from "../helpers/test-db.js";
import { createUserWithToken } from "../helpers/auth.js";
import { LOGIN_MAX_FAILED_ATTEMPTS } from "../../src/middlewares/rateLimit.middleware.js";

const ALLOWED_ORIGIN = "http://localhost:5173";

beforeAll(startTestDB, 120000);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe("Security headers (Helmet)", () => {
  it("adds the protective headers and hides that the API runs on Express", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("CORS", () => {
  it("allows the configured origin", async () => {
    const res = await request(app).get("/api/health").set("Origin", ALLOWED_ORIGIN);

    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  });

  it("does not allow any other origin", async () => {
    const res = await request(app).get("/api/health").set("Origin", "https://evil.example");

    // The server still answers; the missing header is what makes the browser block it.
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers the browser preflight with the allowed methods and headers", async () => {
    const res = await request(app)
      .options("/api/sensors")
      .set("Origin", ALLOWED_ORIGIN)
      .set("Access-Control-Request-Method", "PATCH")
      .set("Access-Control-Request-Headers", "authorization,content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("PATCH");
    expect(res.headers["access-control-allow-headers"]).toContain("Authorization");
  });
});

// The two tests share the limiter count, so their order matters: the first
// one must leave the count at zero for the second one.
describe("Login rate limit", () => {
  let email: string;
  const password = "password123"; // the password createUserWithToken gives every user

  beforeEach(async () => {
    email = (await createUserWithToken("user")).user.email;
  });

  const login = (pass: string) => request(app).post("/api/auth/login").send({ email, password: pass });

  it("does not count successful logins", async () => {
    for (let attempt = 1; attempt <= LOGIN_MAX_FAILED_ATTEMPTS + 1; attempt++) {
      const res = await login(password);
      expect(res.status).toBe(200);
    }
  });

  it("answers 429 after too many failed attempts, even with the right password", async () => {
    for (let attempt = 1; attempt <= LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
      const res = await login("wrong-password");
      expect(res.status).toBe(401);
    }

    const blocked = await login("wrong-password");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      status: "fail",
      error: "TooManyRequests",
      message: "Too many failed login attempts. Try again in 15 minutes.",
    });

    // The IP is blocked: even the right password is rejected now.
    const rightPassword = await login(password);
    expect(rightPassword.status).toBe(429);
  });
});
