# Garden Monitoring API

REST API to monitor a garden. Sensors placed around the garden measure soil humidity, temperature or light, and every value they send is stored as a **reading**. When a reading falls outside the normal range of its sensor, the server marks it as **anomalous**. Users sign up and log in with a JWT; regular users register and query readings, and administrators also manage the sensors.

Built with **Node.js, Express 5, TypeScript and MongoDB (Mongoose)**, validated with **Zod**, documented with **OpenAPI / Swagger UI** and tested with **Vitest + Supertest**.

---

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Trying the API](#trying-the-api)
- [Try it live (curl)](#try-it-live-curl)
- [Endpoints](#endpoints)
- [Response format](#response-format)
- [Running the tests](#running-the-tests)
- [Project structure](#project-structure)

---

## Features

- **Authentication with JWT** and passwords hashed with bcrypt. Anyone can sign up; new accounts always get the `user` role.
- **Two roles:** `admin` (creates, updates and deletes sensors) and `user` (reads sensors, registers and reads readings). Missing or invalid token → `401`; valid token without the right role → `403`.
- **Sensors** with one magnitude each (`soil_humidity` in %, `temperature` in °C, `light` in lx), a location, an active/inactive state and a normal range (`minThreshold`, optional, and `maxThreshold`).
- **Readings** that reference their sensor (no duplicated sensor data). The server decides `isAnomalous` when the reading is saved, and readings cannot be edited or deleted.
- **Reading history** with pagination, filters (`sensor`, `magnitude`, `isAnomalous`, date range) and sorting (`timestamp` or `value`), all combinable, with `meta` and navigation `links`.
- **Validation** of every body and query string with Zod, and one consistent JSON format for every success and every error.
- **Security:** Helmet headers, CORS limited to the configured origins, and a limit of 5 failed login attempts per IP every 15 minutes.
- **Interactive documentation** at `/api/docs` and **67 automated tests**.

---

## Requirements

- **Node.js 22.12 or later** (check with `node -v`) and npm.
- A **MongoDB** database, either:
  - a local MongoDB server (`mongodb://127.0.0.1:27017/...`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (`mongodb+srv://...`).

---

## Getting started

**1. Clone the repository and install the dependencies**

```bash
git clone https://github.com/CarlosGMarcos/DAA_Entrega1_Backend.git
cd DAA_Entrega1_Backend
npm install
```

**2. Create your `.env` file from the template**

```bash
# Linux / macOS
cp .env.example .env
# Windows (PowerShell)
Copy-Item .env.example .env
```

Open `.env` and set at least:

- `MONGODB_URI`: your MongoDB connection string. The last part of the URI is the database name. The default value (`mongodb://127.0.0.1:27017/garden_monitoring`) only works if MongoDB is running on your machine; otherwise use a MongoDB Atlas connection string (`mongodb+srv://<user>:<password>@<cluster>/garden_monitoring`). If the server prints `ECONNREFUSED`, no MongoDB is reachable at that URI.
- `JWT_SECRET`: any long random string (16 characters or more).
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the credentials of the first administrator (see step 4).

All variables are described in [Environment variables](#environment-variables).

**3. Start the server**

```bash
npm run dev
```

You should see:

```
[db] Connected to MongoDB (database: garden_monitoring)
[server] Listening on http://localhost:3000 (development)
[server] API docs at http://localhost:3000/api/docs
```

If a variable is missing or invalid, the server stops right away and lists what is wrong.

**4. The first administrator is created for you**

Signing up through the API always creates a regular `user`, so nobody can make themselves an admin. To have someone who can manage sensors, on startup the server creates an `admin` account with `ADMIN_EMAIL` / `ADMIN_PASSWORD` **if no admin exists yet**. It never creates a second one, so restarting the server is safe. Changing those values later does not modify an existing admin.

---

## Environment variables

| Variable         | Required | Default                 | Description                                                                                |
| ---------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `PORT`           | No       | `3000`                  | Port the server listens on.                                                                |
| `NODE_ENV`       | No       | `development`           | `development`, `test` or `production`. In development, 500 errors include the stack trace. |
| `MONGODB_URI`    | **Yes**  |                         | MongoDB connection string.                                                                 |
| `JWT_SECRET`     | **Yes**  |                         | Secret used to sign the tokens (min. 16 characters).                                       |
| `JWT_EXPIRES_IN` | No       | `8h`                    | Token lifetime (`15m`, `8h`, `1d`...).                                                     |
| `ADMIN_EMAIL`    | No\*     |                         | Email of the first administrator.                                                          |
| `ADMIN_PASSWORD` | No\*     |                         | Password of the first administrator (min. 8 characters).                                   |
| `CORS_ORIGIN`    | No       | `http://localhost:5173` | Browser origins allowed to call the API, comma-separated.                                  |

\* Without them the server still starts, but no administrator is created and nobody can manage sensors.

The real `.env` is git-ignored and must never be committed.

---

## Available scripts

| Command              | What it does                                                       |
| -------------------- | ------------------------------------------------------------------ |
| `npm run dev`        | Starts the server in development mode, restarting on every change. |
| `npm test`           | Runs all the automated tests once.                                 |
| `npm run test:watch` | Runs the tests in watch mode.                                      |
| `npm run typecheck`  | Checks the TypeScript types without building.                      |
| `npm run build`      | Compiles the project to `dist/`.                                   |
| `npm start`          | Runs the compiled version (after `npm run build`).                 |

---

## Trying the API

The easiest way is the interactive documentation: open **http://localhost:3000/api/docs**.

1. **Log in as the administrator:** `POST /auth/login` → _Try it out_ with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Copy `data.token` from the response.
2. Press **Authorize** (top right), paste the token and confirm. Every request from now on carries it.
3. **Create a sensor:** `POST /sensors`, for example:
   ```json
   {
     "name": "Tomato bed thermometer",
     "magnitude": "temperature",
     "location": "Greenhouse",
     "minThreshold": 5,
     "maxThreshold": 35
   }
   ```
   Copy the `_id` of the new sensor.
4. **Sign up a regular user** with `POST /auth/register` and log in with it, then authorize with its token.
5. **Register readings** with `POST /readings`, e.g. `{ "sensor": "<sensor id>", "value": 41 }`. A value outside 5–35 comes back with `"isAnomalous": true`.
6. **Query the history** with `GET /readings`, e.g. `sensor=<id>`, `isAnomalous=true`, `sort=-value`, `limit=2`.
7. As the regular user, try `POST /sensors`: the answer is `403 Forbidden`.

Any HTTP client works the same way (Thunder Client, Postman, curl): send the token in the header `Authorization: Bearer <token>`.

---

## Try it live (curl)

With the server running (`npm run dev`), these commands walk through the whole API from a terminal. They are written for **bash** (Linux, macOS, or **Git Bash** on Windows), because they save the tokens and ids in variables. Replace the admin credentials with the ones in your `.env`.

```bash
API=http://localhost:3000/api

# --- System ---
curl $API/health

# --- Auth ---

# Sign up a regular user -> 201 (role is always "user")
curl -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"email":"ana@garden.com","password":"secret123","name":"Ana"}'

# Same email again -> 409 EmailAlreadyRegistered
curl -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"email":"ana@garden.com","password":"secret123","name":"Ana"}'

# Invalid data -> 400 with one entry per field in "details"
curl -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"123"}'

# Wrong password -> 401 InvalidCredentials
curl -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@garden.com","password":"wrong-password"}'

# Log in and keep the tokens (admin from your .env, and Ana)
ADMIN_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@garden.local","password":"ChangeThisPassword123!"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
ANA_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@garden.com","password":"secret123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

# --- Sensors ---

# No token -> 401 Unauthorized
curl -i $API/sensors

# Tampered token -> 401 InvalidToken
curl -i $API/sensors -H "Authorization: Bearer fake.token.value"

# Any authenticated user can list sensors -> 200
curl $API/sensors -H "Authorization: Bearer $ANA_TOKEN"

# A regular user cannot create sensors -> 403 Forbidden
curl -i -X POST $API/sensors -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Tomato bed thermometer","magnitude":"temperature","location":"Greenhouse","minThreshold":5,"maxThreshold":35}'

# Thresholds out of order -> 400
curl -X POST $API/sensors -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Broken sensor","magnitude":"temperature","location":"Greenhouse","minThreshold":40,"maxThreshold":35}'

# The admin creates it -> 201 (the unit °C is set by the server); keep its id
SENSOR_ID=$(curl -s -X POST $API/sensors -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Tomato bed thermometer","magnitude":"temperature","location":"Greenhouse","minThreshold":5,"maxThreshold":35}' \
  | sed -E 's/.*"_id":"([^"]+)".*/\1/')
echo $SENSOR_ID

# Get it by id -> 200 | malformed id -> 400 | id that does not exist -> 404
curl $API/sensors/$SENSOR_ID -H "Authorization: Bearer $ANA_TOKEN"
curl $API/sensors/abc -H "Authorization: Bearer $ANA_TOKEN"
curl $API/sensors/6710f0f0f0f0f0f0f0f0f0f0 -H "Authorization: Bearer $ANA_TOKEN"

# PATCH that would leave the thresholds out of order (min 50 > max 35) -> 400
curl -X PATCH $API/sensors/$SENSOR_ID -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"minThreshold":50}'

# --- Readings ---

# Normal reading -> 201, "isAnomalous": false
curl -X POST $API/readings -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"sensor\":\"$SENSOR_ID\",\"value\":22}"

# Out of range -> 201, "isAnomalous": true (decided by the server)
curl -X POST $API/readings -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"sensor\":\"$SENSOR_ID\",\"value\":41}"
curl -X POST $API/readings -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"sensor\":\"$SENSOR_ID\",\"value\":2}"

# Unit that does not match the sensor -> 400 UnitMismatch
curl -X POST $API/readings -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"sensor\":\"$SENSOR_ID\",\"value\":22,\"unit\":\"°F\"}"

# Sensor that does not exist -> 404
curl -X POST $API/readings -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d '{"sensor":"6710f0f0f0f0f0f0f0f0f0f0","value":22}'

# History: filter + sort + pagination together -> 200 with meta and links
curl "$API/readings?sensor=$SENSOR_ID&isAnomalous=true&sort=-value&limit=1" -H "Authorization: Bearer $ANA_TOKEN"

# Invalid query string -> 400 (two fields in "details")
curl "$API/readings?isAnomalous=yes&sort=-passwordHash" -H "Authorization: Bearer $ANA_TOKEN"

# A sensor with readings cannot be deleted -> 409; deactivate it instead -> 200
curl -i -X DELETE $API/sensors/$SENSOR_ID -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PATCH $API/sensors/$SENSOR_ID -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"isActive":false}'

# An inactive sensor does not accept readings -> 409
curl -X POST $API/readings -H "Authorization: Bearer $ANA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"sensor\":\"$SENSOR_ID\",\"value\":22}"

# --- Security ---

# Helmet headers, and CORS only for the allowed origin (compare both responses)
curl -i $API/health -H "Origin: http://localhost:5173"
curl -i $API/health -H "Origin: https://evil.example"

# Login rate limit: after 5 failed attempts from your IP, the next ones get 429 instead of 401
# (the wrong-password login above already counted as one, so here 429 appears from the 5th try)
# (it blocks logins from your IP for 15 minutes: restart the server to reset it)
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/auth/login -H "Content-Type: application/json" \
    -d '{"email":"ana@garden.com","password":"wrong-password"}'
done
```

---

## Endpoints

All routes are under `/api`.

| Method | Route            | Access        | Description                                                                |
| ------ | ---------------- | ------------- | -------------------------------------------------------------------------- |
| GET    | `/health`        | Public        | The API is running.                                                        |
| POST   | `/auth/register` | Public        | Create an account (always role `user`).                                    |
| POST   | `/auth/login`    | Public        | Log in and get a token. Limited to 5 failed attempts per IP / 15 min.      |
| GET    | `/sensors`       | Authenticated | List all sensors.                                                          |
| GET    | `/sensors/:id`   | Authenticated | Get one sensor.                                                            |
| POST   | `/sensors`       | Admin         | Create a sensor.                                                           |
| PATCH  | `/sensors/:id`   | Admin         | Update a sensor partially (e.g. `{ "isActive": false }`).                  |
| DELETE | `/sensors/:id`   | Admin         | Delete a sensor (`409` if it already has readings: deactivate it instead). |
| GET    | `/readings`      | Authenticated | Paginated, filterable and sortable reading history.                        |
| GET    | `/readings/:id`  | Authenticated | Get one reading with its sensor.                                           |
| POST   | `/readings`      | Authenticated | Register a reading (the sensor must exist and be active).                  |
| GET    | `/docs`          | Public        | Swagger UI.                                                                |

**Query parameters of `GET /api/readings`** (all optional and combinable):

| Parameter     | Example                    | Meaning                                                                        |
| ------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `page`        | `2`                        | Page number (default `1`).                                                     |
| `limit`       | `10`                       | Readings per page, 1–100 (default `20`).                                       |
| `sensor`      | `6716a2f4c1d2e3f4a5b6c7d8` | Only readings of this sensor.                                                  |
| `magnitude`   | `temperature`              | Only readings of sensors that measure this magnitude.                          |
| `isAnomalous` | `true`                     | Only anomalous (`true`) or normal (`false`) readings.                          |
| `from`, `to`  | `2026-10-20T00:00:00Z`     | Date range (ISO 8601) on the reading timestamp.                                |
| `sort`        | `-value`                   | `timestamp` or `value`; a leading `-` means descending (default `-timestamp`). |

**When is a reading anomalous?** When its value is below the sensor's `minThreshold` or above its `maxThreshold` (the limits themselves are normal). It is decided once, when the reading is saved: changing the sensor's range later does not change old readings.

---

## Response format

Every response has the same shape.

**Success:**

```json
{ "status": "success", "data": { "...": "..." } }
```

**Paginated list** (`GET /api/readings`):

```json
{
  "status": "success",
  "data": [
    { "_id": "...", "sensor": { "name": "Tomato bed thermometer", "magnitude": "temperature" }, "value": 38, "isAnomalous": true }
  ],
  "meta": { "total": 3, "page": 1, "limit": 2, "totalPages": 2, "hasNextPage": true, "hasPrevPage": false },
  "links": {
    "first": "/api/readings?...&page=1",
    "prev": null,
    "next": "/api/readings?...&page=2",
    "last": "/api/readings?...&page=2"
  }
}
```

**Error:** `fail` for client errors (4xx), `error` for server errors (5xx). Validation errors list every wrong field in `details`.

```json
{
  "status": "fail",
  "error": "ValidationError",
  "message": "The request data is not valid.",
  "details": [{ "field": "limit", "message": "limit cannot be more than 100" }]
}
```

---

## Running the tests

```bash
npm test
```

The tests **do not use your database or your `.env`**: every test file starts its own temporary in-memory MongoDB ([mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server)) and gets fixed configuration values from `vitest.config.ts`.

> The **first run downloads a MongoDB binary** and needs an internet connection, so it takes longer. Later runs reuse it.

Expected result: **67 tests passing in 8 files**.

| File                                      | What it covers                                                      |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `tests/integration/app.test.ts`           | Health check, unknown routes, malformed JSON, error format.         |
| `tests/integration/auth.test.ts`          | Sign-up and login, including duplicate email and wrong credentials. |
| `tests/integration/sensors.test.ts`       | Full sensor lifecycle and role checks (`401` / `403`).              |
| `tests/integration/reading.test.ts`       | Registering readings, anomaly rule, unit and sensor checks.         |
| `tests/integration/readings-list.test.ts` | Pagination, filters, sorting and invalid queries of the history.    |
| `tests/integration/security.test.ts`      | Helmet headers, CORS and the login rate limit.                      |
| `tests/unit/anomaly.test.ts`              | The anomaly rule, including the edges of the range.                 |
| `tests/unit/pagination.test.ts`           | Page calculations and pagination links.                             |

---

## Project structure

```
src/
├── server.ts                          → entry point: connects to MongoDB, creates the first admin, then app.listen (NOT used by the tests)
├── app.ts                             → Express app exported without listen: Helmet, CORS, JSON parser, routes, Swagger UI, error handlers
├── config/
│   ├── env.ts                         → reads .env and validates every variable with Zod (stops the server if one is wrong)
│   └── database.ts                    → connectDB / disconnectDB with Mongoose
├── routes/
│   ├── auth.routes.ts                 → /api/auth: register, login (with the login rate limit)
│   ├── sensors.routes.ts              → /api/sensors: reads for any user, create/update/delete for admin only
│   └── readings.routes.ts             → /api/readings: list (query validation), register, get by id
├── middlewares/
│   ├── auth.middleware.ts             → authenticate (JWT → req.user, 401) and authorize(...roles) (403)
│   ├── validate.middleware.ts         → validateBody and validateQuery with Zod
│   ├── validateObjectId.middleware.ts → 400 for ids that cannot be a MongoDB ObjectId
│   ├── rateLimit.middleware.ts        → loginLimiter: 5 failed logins per IP / 15 min → 429
│   └── error.middleware.ts            → notFoundHandler (404) + globalErrorHandler (Zod, Mongoose, duplicate key, AppError, 500)
├── controllers/
│   ├── auth.controller.ts             → register (201), login (200)
│   ├── sensors.controller.ts          → sensor CRUD responses
│   └── readings.controller.ts         → list, create (201), get by id
├── services/
│   ├── auth.service.ts                → sign-up (bcrypt hash, duplicate email → 409) and login (same 401 for any wrong credential)
│   ├── token.service.ts               → signs and verifies the JWT
│   ├── seed.service.ts                → creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (idempotent)
│   ├── sensors.service.ts             → sensor CRUD; deleting a sensor with readings → 409
│   ├── readings.service.ts            → anomaly rule (isOutOfRange), register checks (404 / 409 / 400 unit), list with filters and sort
│   └── pagination.service.ts          → buildPaginationMeta and buildPaginationLinks (pure functions)
├── models/
│   ├── sensor.model.ts                → Sensor (unit set from the magnitude, thresholds checked before saving)
│   ├── reading.model.ts               → Reading (ref to Sensor, index { sensor, timestamp })
│   └── user.model.ts                  → User (unique email, passwordHash hidden from every response)
├── schemas/
│   ├── auth.schema.ts                 → register / login bodies
│   ├── sensor.schema.ts               → create / update bodies (thresholds in order)
│   └── reading.schema.ts              → create body + query string of the history list (page, limit, filters, sort)
├── errors/
│   ├── app.error.ts                   → AppError (base class with statusCode)
│   ├── http.errors.ts                 → NotFound (404), Conflict (409), UnitMismatch (400)
│   └── auth.errors.ts                 → Unauthorized / InvalidToken / InvalidCredentials (401), Forbidden (403), EmailAlreadyRegistered (409)
├── types/
│   ├── sensor.types.ts                → magnitudes and their units (single source of truth)
│   ├── reading.types.ts               → IReading
│   ├── user.types.ts                  → roles and the token payload
│   └── pagination.types.ts            → PaginationMeta, PaginationLinks, PaginatedResult<T>
└── docs/
    └── openapi.json                   → OpenAPI 3 contract served at /api/docs (bearerAuth)
tests/
├── helpers/
│   ├── test-db.ts                     → in-memory MongoDB: start, clear between tests, stop
│   └── auth.ts                        → createUserWithToken(role) and bearer(token)
├── integration/                       → requests against the real app with Supertest
│   ├── app.test.ts                    → health check, unknown routes (404), malformed JSON (400), error format
│   ├── auth.test.ts                   → sign-up and login: duplicate email (409), invalid data (400), wrong credentials (401)
│   ├── sensors.test.ts                → full sensor lifecycle (CRUD) and role checks (401 / 403)
│   ├── reading.test.ts                → registering readings: anomaly rule, unit and sensor checks, populate, delete blocked (409)
│   ├── readings-list.test.ts          → history: pagination, filters, sorting with tie-break, invalid queries (400)
│   └── security.test.ts               → Helmet headers, CORS, login rate limit (429)
└── unit/                              → pure functions, without database
    ├── anomaly.test.ts                → isOutOfRange, including the edges of the range
    └── pagination.test.ts             → buildPaginationMeta and buildPaginationLinks
```

A request travels **route → middlewares → controller → service → model**, and any error on the way ends in the global error handler, which turns it into the JSON error format above.

---

## Author

[@CarlosGMarcos](https://github.com/CarlosGMarcos) · Desarrollo de Aplicaciones Avanzadas, Universidad de Salamanca.
