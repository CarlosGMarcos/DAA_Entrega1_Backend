/* ============================================================================
 * Sensor routes, mounted at /api/sensors
 * Every route needs a valid token. Reading is open to any role; creating,
 * updating and deleting are admin-only. Auth runs before validation, so an
 * unauthorized client never learns anything about the expected body.
 * ========================================================================== */

import { Router } from "express";
import * as sensorsController from "../controllers/sensors.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { validateObjectId } from "../middlewares/validateObjectId.middleware.js";
import { createSensorSchema, updateSensorSchema } from "../schemas/sensor.schema.js";

const router = Router();

// Applies to every route below.
router.use(authenticate);

router.get("/", sensorsController.listSensors);
router.get("/:id", validateObjectId(), sensorsController.getSensor);

router.post("/", authorize("admin"), validateBody(createSensorSchema), sensorsController.createSensor);
router.patch("/:id", authorize("admin"), validateObjectId(), validateBody(updateSensorSchema), sensorsController.updateSensor);
router.delete("/:id", authorize("admin"), validateObjectId(), sensorsController.deleteSensor);

export default router;
