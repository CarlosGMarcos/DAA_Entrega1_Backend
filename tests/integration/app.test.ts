/* ============================================================================
 * Integration tests: application basics
 * Health check, unknown routes and the shared error format.
 * ========================================================================== */

import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/health", () => {
  it("responds 200 with the success envelope", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.service).toBe("garden-monitoring-api");
  });
});

describe("Unknown routes", () => {
  it("respond 404 with the error envelope", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: "fail",
      error: "RouteNotFound",
      message: "Route not found: GET /api/this-route-does-not-exist",
    });
  });
});

describe("Malformed JSON body", () => {
  it("is rejected with 400 instead of a 500", async () => {
    const res = await request(app).post("/api/health").set("Content-Type", "application/json").send('{"name": "broken json"');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
    expect(res.body.error).toBe("InvalidJSON");
  });
});

describe("API documentation", () => {
  it("is served at /api/docs", async () => {
    const res = await request(app).get("/api/docs/");

    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });
});
