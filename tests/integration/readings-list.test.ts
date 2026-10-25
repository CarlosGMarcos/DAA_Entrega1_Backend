/* ============================================================================
 * Integration tests: readings history (GET /api/readings)
 * Pagination, filters and sorting against a known set of readings, so every
 * test knows exactly which readings must come back and in which order.
 * ========================================================================== */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { startTestDB, clearTestDB, stopTestDB } from "../helpers/test-db.js";
import { createUserWithToken, bearer } from "../helpers/auth.js";

let userToken: string;
let thermometerId: string;
let lightMeterId: string;
// Ids of the two readings with value 38, in the order they were created.
let firstTieId: string;
let secondTieId: string;

beforeAll(startTestDB, 120000);
// Two sensors and 7 readings with fixed dates (4 anomalous, 3 normal):
//   thermometer (5-35 °C): 18, 38*, 3*, 38*, 25
//   light meter (max 50000 lx): 12000, 65000*
beforeEach(async () => {
  const adminToken = (await createUserWithToken("admin")).token;
  userToken = (await createUserWithToken("user")).token;

  // Creates a sensor as admin and returns its id.
  const createSensor = async (body: object) => (await request(app).post("/api/sensors").set(bearer(adminToken)).send(body)).body.data._id;
  thermometerId = await createSensor({
    name: "Bed thermometer",
    magnitude: "temperature",
    location: "Bed 1",
    minThreshold: 5,
    maxThreshold: 35,
  });
  lightMeterId = await createSensor({ name: "Roof light meter", magnitude: "light", location: "Roof", maxThreshold: 50000 });

  // One by one, so the creation order (and therefore the _id order) is known.
  const postReading = async (sensor: string, value: number, timestamp: string) =>
    (await request(app).post("/api/readings").set(bearer(userToken)).send({ sensor, value, timestamp })).body.data._id;

  await postReading(thermometerId, 18, "2026-01-20T08:00:00Z");
  firstTieId = await postReading(thermometerId, 38, "2026-01-21T14:00:00Z");
  await postReading(thermometerId, 3, "2026-01-22T06:00:00Z");
  secondTieId = await postReading(thermometerId, 38, "2026-01-23T15:00:00Z");
  await postReading(thermometerId, 25, "2026-01-24T10:00:00Z");
  await postReading(lightMeterId, 12000, "2026-01-22T12:00:00Z");
  await postReading(lightMeterId, 65000, "2026-01-23T13:00:00Z");
});
afterEach(clearTestDB);
afterAll(stopTestDB);

// GET as a regular user; accepts a query string or a full link from "links".
const getReadings = (pathAndQuery: string) => request(app).get(pathAndQuery).set(bearer(userToken));
const values = (res: request.Response) => res.body.data.map((reading: { value: number }) => reading.value);

describe("Readings history: pagination", () => {
  it("returns the newest readings first, with meta, links and the sensor populated", async () => {
    const res = await getReadings("/api/readings");

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 7, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    expect(values(res)).toEqual([25, 38, 65000, 12000, 3, 38, 18]);
    expect(res.body.data[0].sensor.name).toBe("Bed thermometer");
    expect(res.body.links.next).toBeNull();
  });

  it("splits the results into pages that can be followed with links.next", async () => {
    const page1 = await getReadings("/api/readings?limit=3");
    const page2 = await getReadings(page1.body.links.next);
    const page3 = await getReadings(page2.body.links.next);

    expect(page1.body.meta.totalPages).toBe(3);
    expect(values(page1)).toEqual([25, 38, 65000]);
    expect(values(page2)).toEqual([12000, 3, 38]);
    expect(values(page3)).toEqual([18]);
    expect(page3.body.meta.hasPrevPage).toBe(true);
    expect(page3.body.links.next).toBeNull();
  });
});

describe("Readings history: filters", () => {
  it("filters by isAnomalous, and false is a real filter", async () => {
    const anomalous = await getReadings("/api/readings?isAnomalous=true");
    const normal = await getReadings("/api/readings?isAnomalous=false");

    expect(anomalous.body.meta.total).toBe(4);
    expect(normal.body.meta.total).toBe(3);
    expect(normal.body.data.every((reading: { isAnomalous: boolean }) => reading.isAnomalous === false)).toBe(true);
  });

  it("filters by the magnitude of the sensor", async () => {
    const res = await getReadings("/api/readings?magnitude=light");

    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.every((reading: { sensor: { magnitude: string } }) => reading.sensor.magnitude === "light")).toBe(true);
  });

  it("returns an empty page when sensor and magnitude do not match", async () => {
    const res = await getReadings(`/api/readings?sensor=${thermometerId}&magnitude=light`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.totalPages).toBe(1);
  });

  it("filters by a date range", async () => {
    const res = await getReadings("/api/readings?from=2026-01-22T00:00:00Z&to=2026-01-23T23:59:59Z");

    expect(values(res)).toEqual([38, 65000, 12000, 3]);
  });
});

describe("Readings history: sorting", () => {
  it("sorts by value and breaks ties by creation order", async () => {
    const res = await getReadings(`/api/readings?sensor=${thermometerId}&sort=-value`);

    expect(values(res)).toEqual([38, 38, 25, 18, 3]);
    // Same value: the one created later comes first, every time.
    expect(res.body.data[0]._id).toBe(secondTieId);
    expect(res.body.data[1]._id).toBe(firstTieId);
  });

  it("combines filter, sort and pagination, and the links keep the filters", async () => {
    const page1 = await getReadings(`/api/readings?sensor=${thermometerId}&isAnomalous=true&sort=-value&limit=2`);
    const page2 = await getReadings(page1.body.links.next);

    expect(page1.body.meta.total).toBe(3);
    expect(values(page1)).toEqual([38, 38]);
    expect(page1.body.links.next).toContain(`sensor=${thermometerId}`);
    expect(page1.body.links.next).toContain("isAnomalous=true");
    expect(page1.body.links.next).toContain("sort=-value");
    expect(values(page2)).toEqual([3]);
  });
});

describe("Readings history: invalid queries", () => {
  it.each([
    { query: "limit=500", field: "limit" },
    { query: "limit=0", field: "limit" },
    { query: "page=0", field: "page" },
    { query: "isAnomalous=yes", field: "isAnomalous" },
    { query: "sort=-passwordHash", field: "sort" },
    { query: "magnitude=wind", field: "magnitude" },
    { query: "sensor=123", field: "sensor" },
    { query: "from=2026-01-23T00:00:00Z&to=2026-01-20T00:00:00Z", field: "from" },
  ])("rejects ?$query with 400 on $field", async ({ query, field }) => {
    const res = await getReadings(`/api/readings?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe(field);
  });

  it("requires a token", async () => {
    const res = await request(app).get("/api/readings");

    expect(res.status).toBe(401);
  });
});
