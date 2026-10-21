/* ============================================================================
 * Integration tests: sensors
 * Full lifecycle of a sensor (create, read, update, delete), the validation
 * rules that protect it and who may do what, against an in-memory MongoDB.
 * ========================================================================== */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { startTestDB, clearTestDB, stopTestDB } from "../helpers/test-db.js";
import { createUserWithToken, bearer } from "../helpers/auth.js";

const validSensor = {
  name: "Bed thermometer",
  magnitude: "temperature",
  location: "Bed 1",
  minThreshold: 5,
  maxThreshold: 35,
};

let adminToken: string;
let userToken: string;

// The first run downloads the MongoDB binary, so this hook gets extra time.
beforeAll(startTestDB, 120000);
// clearTestDB empties the users too, so they are created again before each test.
beforeEach(async () => {
  adminToken = (await createUserWithToken("admin")).token;
  userToken = (await createUserWithToken("user")).token;
});
afterEach(clearTestDB);
afterAll(stopTestDB);

describe("Sensor lifecycle (admin)", () => {
  it("creates, reads, updates and deletes a sensor", async () => {
    // 1. Create: the server sets the unit from the magnitude.
    const created = await request(app).post("/api/sensors").set(bearer(adminToken)).send(validSensor);
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("success");
    expect(created.body.data.unit).toBe("°C");
    expect(created.body.data.isActive).toBe(true);
    const id = created.body.data._id;

    // 2. Read it back, alone and in the list.
    const fetched = await request(app).get(`/api/sensors/${id}`).set(bearer(adminToken));
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.name).toBe("Bed thermometer");

    const list = await request(app).get("/api/sensors").set(bearer(adminToken));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    // 3. Partial update.
    const updated = await request(app).patch(`/api/sensors/${id}`).set(bearer(adminToken)).send({ isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data.isActive).toBe(false);
    expect(updated.body.data.maxThreshold).toBe(35);

    // 4. Delete, then it no longer exists.
    const deleted = await request(app).delete(`/api/sensors/${id}`).set(bearer(adminToken));
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app).get(`/api/sensors/${id}`).set(bearer(adminToken));
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.error).toBe("NotFound");
  });
});

describe("Sensor validation", () => {
  it("rejects a sensor with an unknown magnitude", async () => {
    const res = await request(app)
      .post("/api/sensors")
      .set(bearer(adminToken))
      .send({ ...validSensor, magnitude: "pressure" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details[0].field).toBe("magnitude");
  });

  it("rejects thresholds out of order on create (checked by Zod)", async () => {
    const res = await request(app)
      .post("/api/sensors")
      .set(bearer(adminToken))
      .send({ ...validSensor, minThreshold: 40 });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("minThreshold");
  });

  it("rejects thresholds out of order on a partial update (checked by the model)", async () => {
    const created = await request(app).post("/api/sensors").set(bearer(adminToken)).send(validSensor);

    const res = await request(app).patch(`/api/sensors/${created.body.data._id}`).set(bearer(adminToken)).send({ minThreshold: 90 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details[0].field).toBe("minThreshold");
  });

  it("ignores a unit sent by the client", async () => {
    const res = await request(app)
      .post("/api/sensors")
      .set(bearer(adminToken))
      .send({ ...validSensor, unit: "lx" });

    expect(res.status).toBe(201);
    expect(res.body.data.unit).toBe("°C");
  });

  it("answers 400 for a malformed id and 404 for an unknown one", async () => {
    const malformed = await request(app).get("/api/sensors/abc").set(bearer(adminToken));
    expect(malformed.status).toBe(400);
    expect(malformed.body.error).toBe("InvalidObjectId");

    const unknown = await request(app).get("/api/sensors/6710f0f0f0f0f0f0f0f0f0f0").set(bearer(adminToken));
    expect(unknown.status).toBe(404);
  });
});

describe("Sensor access control", () => {
  it("answers 401 without a token", async () => {
    const res = await request(app).get("/api/sensors");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("answers 401 with a tampered token", async () => {
    const res = await request(app)
      .get("/api/sensors")
      .set(bearer(`${userToken}x`));

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("InvalidToken");
  });

  it("lets a regular user read sensors", async () => {
    const res = await request(app).get("/api/sensors").set(bearer(userToken));

    expect(res.status).toBe(200);
  });

  it("blocks a regular user from creating, updating or deleting sensors with 403", async () => {
    const created = await request(app).post("/api/sensors").set(bearer(adminToken)).send(validSensor);
    const id = created.body.data._id;

    const create = await request(app).post("/api/sensors").set(bearer(userToken)).send(validSensor);
    const update = await request(app).patch(`/api/sensors/${id}`).set(bearer(userToken)).send({ isActive: false });
    const remove = await request(app).delete(`/api/sensors/${id}`).set(bearer(userToken));

    for (const res of [create, update, remove]) {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    }
  });
});
