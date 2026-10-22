/* ============================================================================
 * Reading routes, mounted at /api/readings
 * Any authenticated user (user or admin) may register and read readings.
 * Readings are an immutable history: there is no PATCH or DELETE.
 * ========================================================================== */

import { Router } from "express";
import * as readingsController from "../controllers/readings.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { validateObjectId } from "../middlewares/validateObjectId.middleware.js";
import { createReadingSchema } from "../schemas/reading.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createReadingSchema), readingsController.createReading);
router.get("/:id", validateObjectId(), readingsController.getReading);
// There's no PATCH or DELETE because readings are an immutable history.

export default router;
