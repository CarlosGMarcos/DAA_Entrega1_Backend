/* ============================================================================
 * Reading routes, mounted at /api/readings
 * Any authenticated user (user or admin) may register and read readings.
 * Readings are an immutable history: there is no PATCH or DELETE.
 * ========================================================================== */

import { Router } from "express";
import * as readingsController from "../controllers/readings.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import { validateObjectId } from "../middlewares/validateObjectId.middleware.js";
import { createReadingSchema, listReadingsQuerySchema } from "../schemas/reading.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listReadingsQuerySchema), readingsController.listReadings);
router.post("/", validateBody(createReadingSchema), readingsController.createReading);
router.get("/:id", validateObjectId(), readingsController.getReading);

export default router;
