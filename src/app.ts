/* ============================================================================
 * Express application
 * Builds and configures the app (middlewares, routes, error handling) but
 * does NOT start listening: server.ts does that. Keeping them apart lets the
 * tests import `app` and send requests to it without opening a real port.
 * ========================================================================== */

import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./docs/openapi.json" with { type: "json" };
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.middleware.js";
import sensorsRoutes from "./routes/sensors.routes.js";
import authRoutes from "./routes/auth.routes.js";

export const app = express();

app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: { service: "garden-monitoring-api", uptimeSeconds: process.uptime() },
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/sensors", sensorsRoutes);

// Interactive API documentation (Swagger UI).
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Always last, in this order: unknown routes first, then every error.
app.use(notFoundHandler);
app.use(globalErrorHandler);

// implementing a Database connection does not change the app iself,
// app doesn't need to know about the database, it just needs to be
// able to handle requests and responses.
// The database connection is handled in server.ts, which is responsible
// for starting the server and connecting to the database before the
// app starts listening for requests.
