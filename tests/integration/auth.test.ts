/* ============================================================================
 * Integration tests: authentication
 * Sign-up and login through the real endpoints, including the failure cases
 * (duplicate email, bad input, wrong credentials).
 * ========================================================================== */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { startTestDB, clearTestDB, stopTestDB } from "../helpers/test-db.js";
import { bearer } from "../helpers/auth.js";

const ana = { email: "ana@garden.com", password: "secret123", name: "Ana" };

beforeAll(startTestDB, 120000);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe("POST /api/auth/register", () => {
  it("creates a regular user and returns a token, never the password hash", async () => {
    const res = await request(app).post("/api/auth/register").send(ana);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe("ana@garden.com");
    expect(res.body.data.user.role).toBe("user");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("ignores a role sent by the client", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...ana, role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("user");
  });

  it("rejects an email that is already registered with 409", async () => {
    await request(app).post("/api/auth/register").send(ana);
    const res = await request(app).post("/api/auth/register").send(ana);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("EmailAlreadyRegistered");
  });

  it("rejects invalid data with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token that opens protected routes", async () => {
    await request(app).post("/api/auth/register").send(ana);

    const login = await request(app).post("/api/auth/login").send({ email: ana.email, password: ana.password });
    expect(login.status).toBe(200);

    const sensors = await request(app).get("/api/sensors").set(bearer(login.body.data.token));
    expect(sensors.status).toBe(200);
  });

  it("answers the same 401 for a wrong password and for an unknown email", async () => {
    await request(app).post("/api/auth/register").send(ana);

    const wrongPassword = await request(app).post("/api/auth/login").send({ email: ana.email, password: "wrong-password" });
    const unknownEmail = await request(app).post("/api/auth/login").send({ email: "nobody@garden.com", password: ana.password });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error).toBe("InvalidCredentials");
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});
