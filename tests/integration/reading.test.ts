/* ============================================================================
 * Integration tests: readings
 * Registering readings (anomaly rule, sensor and unit checks) and the relation
 * between readings and sensors.
 * ========================================================================== */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { startTestDB, clearTestDB, stopTestDB } from "../helpers/test-db.js";
import { createUserWithToken, bearer } from "../helpers/auth.js";

let adminToken: string;
let userToken: string;
let sensorId: string;

beforeAll(startTestDB, 120000);
// A fresh admin, user and temperature sensor (normal range 5-35 °C) per test.
beforeEach(async () => {
  adminToken = (await createUserWithToken("admin")).token;
  userToken = (await createUserWithToken("user")).token;

  const sensor = await request(app)
    .post("/api/sensors")
    .set(bearer(adminToken))
    .send({ name: "Bed thermometer", magnitude: "temperature", location: "Bed 1", minThreshold: 5, maxThreshold: 35 });
  sensorId = sensor.body.data._id;
});
afterEach(clearTestDB);
afterAll(stopTestDB);

// Registers a reading as a regular user.
const postReading = (body: object) => request(app).post("/api/readings").set(bearer(userToken)).send(body);

describe("Registering readings", () => {
  it("saves a normal reading with the sensor unit", async () => {
    const res = await postReading({ sensor: sensorId, value: 22 });

    expect(res.status).toBe(201);
    expect(res.body.data.isAnomalous).toBe(false);
    expect(res.body.data.unit).toBe("°C");
    expect(res.body.data.sensor).toBe(sensorId);
  });

  it("marks values outside the range as anomalous, and the edges as normal", async () => {
    const above = await postReading({ sensor: sensorId, value: 41 });
    const below = await postReading({ sensor: sensorId, value: 2 });
    const edge = await postReading({ sensor: sensorId, value: 35 });

    expect(above.body.data.isAnomalous).toBe(true);
    expect(below.body.data.isAnomalous).toBe(true);
    expect(edge.body.data.isAnomalous).toBe(false);
  });

  it("ignores an isAnomalous value sent by the client", async () => {
    const res = await postReading({ sensor: sensorId, value: 22, isAnomalous: true });

    expect(res.status).toBe(201);
    expect(res.body.data.isAnomalous).toBe(false);
  });

  it("accepts the matching unit and rejects a different one with 400", async () => {
    const same = await postReading({ sensor: sensorId, value: 22, unit: "°C" });
    const different = await postReading({ sensor: sensorId, value: 22, unit: "°F" });

    expect(same.status).toBe(201);
    expect(different.status).toBe(400);
    expect(different.body.error).toBe("UnitMismatch");
  });

  it("rejects a timestamp in the future with 400", async () => {
    const res = await postReading({ sensor: sensorId, value: 22, timestamp: "2099-01-01T00:00:00Z" });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("timestamp");
  });

  it("answers 404 for a sensor that does not exist", async () => {
    const res = await postReading({ sensor: "6710f0f0f0f0f0f0f0f0f0f0", value: 22 });

    expect(res.status).toBe(404);
  });

  it("answers 409 when the sensor is inactive", async () => {
    await request(app).patch(`/api/sensors/${sensorId}`).set(bearer(adminToken)).send({ isActive: false });

    const res = await postReading({ sensor: sensorId, value: 22 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  it("requires a token", async () => {
    const res = await request(app).post("/api/readings").send({ sensor: sensorId, value: 22 });

    expect(res.status).toBe(401);
  });
});

describe("Reading history", () => {
  it("returns a reading with its sensor populated", async () => {
    const created = await postReading({ sensor: sensorId, value: 41 });

    const res = await request(app).get(`/api/readings/${created.body.data._id}`).set(bearer(userToken));

    expect(res.status).toBe(200);
    expect(res.body.data.sensor.name).toBe("Bed thermometer");
    expect(res.body.data.sensor.magnitude).toBe("temperature");
  });

  it("keeps isAnomalous as it was decided when the reading was saved", async () => {
    const created = await postReading({ sensor: sensorId, value: 41 });
    // Widen the range afterwards: 41 would now be normal.
    await request(app).patch(`/api/sensors/${sensorId}`).set(bearer(adminToken)).send({ maxThreshold: 50 });

    const res = await request(app).get(`/api/readings/${created.body.data._id}`).set(bearer(userToken));

    expect(res.body.data.isAnomalous).toBe(true);
  });

  it("cannot be modified: there is no PATCH route for readings", async () => {
    const created = await postReading({ sensor: sensorId, value: 22 });

    const res = await request(app).patch(`/api/readings/${created.body.data._id}`).set(bearer(adminToken)).send({ value: 99 });

    expect(res.status).toBe(404);
  });

  it("blocks deleting a sensor that has readings with 409", async () => {
    await postReading({ sensor: sensorId, value: 22 });

    const res = await request(app).delete(`/api/sensors/${sensorId}`).set(bearer(adminToken));

    expect(res.status).toBe(409);
  });
});
