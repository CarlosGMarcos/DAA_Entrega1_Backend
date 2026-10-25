/* ============================================================================
 * Reading routes (/api/readings)
 * Open to any authenticated user. There is no PATCH or DELETE: readings
 * cannot be modified.
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
