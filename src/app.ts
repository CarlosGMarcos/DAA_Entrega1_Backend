/* ============================================================================
 * Express application
 * Configures middlewares, routes and error handling. It does not connect to
 * the database or start listening: server.ts does both.
 * ========================================================================== */

import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./docs/openapi.json" with { type: "json" };
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.middleware.js";
import sensorsRoutes from "./routes/sensors.routes.js";
import authRoutes from "./routes/auth.routes.js";
import readingsRoutes from "./routes/readings.routes.js";
import { env } from "./config/env.js";

export const app = express();

// Order matters: security headers first, then CORS, and
// only then the JSON body parser, so a rejected request never gets parsed.

// 1. Security headers. Helmet also removes the "X-Powered-By: Express" header, which reveals the technology in use.
app.use(helmet());

// 2. CORS: only the origins listed in CORS_ORIGIN (the future frontend) may
// call the API from a browser. The token travels in the Authorization header,
// not in cookies, so credentials are not needed.
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. JSON body parser.
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: { service: "garden-monitoring-api", uptimeSeconds: process.uptime() },
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/sensors", sensorsRoutes);
app.use("/api/readings", readingsRoutes);

// Interactive API documentation (Swagger UI).
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Always last, in this order: unknown routes first, then every error.
app.use(notFoundHandler);
app.use(globalErrorHandler);
