/* ============================================================================
 * Sensor routes (/api/sensors)
 * Every route needs a token. Reading is open to any role; creating, updating
 * and deleting are admin only, and the role is checked before the body.
 * ========================================================================== */

import { Router } from "express";
import * as sensorsController from "../controllers/sensors.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { validateObjectId } from "../middlewares/validateObjectId.middleware.js";
import { createSensorSchema, updateSensorSchema } from "../schemas/sensor.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", sensorsController.listSensors);
router.get("/:id", validateObjectId(), sensorsController.getSensor);

// Without authorize("admin") a regular user would get 201 here, and the access-control tests (which expect 403) would fail.
router.post("/", authorize("admin"), validateBody(createSensorSchema), sensorsController.createSensor);
router.patch("/:id", authorize("admin"), validateObjectId(), validateBody(updateSensorSchema), sensorsController.updateSensor);
router.delete("/:id", authorize("admin"), validateObjectId(), sensorsController.deleteSensor);

export default router;
