/* ============================================================================
 * Integration tests: sensors
 * Full lifecycle of a sensor (create, read, update, delete) plus the
 * validation rules that protect it, against an in-memory MongoDB.
 * ========================================================================== */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { startTestDB, clearTestDB, stopTestDB } from "../helpers/test-db.js";

const validSensor = {
  name: "Bed thermometer",
  magnitude: "temperature",
  location: "Bed 1",
  minThreshold: 5,
  maxThreshold: 35,
};

// The first run downloads the MongoDB binary, so this hook gets extra time.
beforeAll(startTestDB, 120000);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe("Sensor lifecycle", () => {
  it("creates, reads, updates and deletes a sensor", async () => {
    // 1. Create: the server sets the unit from the magnitude.
    const created = await request(app).post("/api/sensors").send(validSensor);
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("success");
    expect(created.body.data.unit).toBe("°C");
    expect(created.body.data.isActive).toBe(true);
    const id = created.body.data._id;

    // 2. Read it back, alone and in the list.
    const fetched = await request(app).get(`/api/sensors/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.name).toBe("Bed thermometer");

    const list = await request(app).get("/api/sensors");
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    // 3. Partial update.
    const updated = await request(app).patch(`/api/sensors/${id}`).send({ isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data.isActive).toBe(false);
    expect(updated.body.data.maxThreshold).toBe(35);

    // 4. Delete, then it no longer exists.
    const deleted = await request(app).delete(`/api/sensors/${id}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app).get(`/api/sensors/${id}`);
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.error).toBe("NotFound");
  });
});

describe("Sensor validation", () => {
  it("rejects a sensor with an unknown magnitude", async () => {
    const res = await request(app)
      .post("/api/sensors")
      .send({ ...validSensor, magnitude: "pressure" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details[0].field).toBe("magnitude");
  });

  it("rejects thresholds out of order on create (checked by Zod)", async () => {
    const res = await request(app)
      .post("/api/sensors")
      .send({ ...validSensor, minThreshold: 40 });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("minThreshold");
  });

  it("rejects thresholds out of order on a partial update (checked by the model)", async () => {
    const created = await request(app).post("/api/sensors").send(validSensor);

    const res = await request(app).patch(`/api/sensors/${created.body.data._id}`).send({ minThreshold: 90 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details[0].field).toBe("minThreshold");
  });

  it("ignores a unit sent by the client", async () => {
    const res = await request(app)
      .post("/api/sensors")
      .send({ ...validSensor, unit: "lx" });

    expect(res.status).toBe(201);
    expect(res.body.data.unit).toBe("°C");
  });

  it("answers 400 for a malformed id and 404 for an unknown one", async () => {
    const malformed = await request(app).get("/api/sensors/abc");
    expect(malformed.status).toBe(400);
    expect(malformed.body.error).toBe("InvalidObjectId");

    const unknown = await request(app).get("/api/sensors/6710f0f0f0f0f0f0f0f0f0f0");
    expect(unknown.status).toBe(404);
  });
});
