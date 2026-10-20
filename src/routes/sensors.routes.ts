/* ============================================================================
 * Sensor routes, mounted at /api/sensors
 * Each route lists, in order, the middlewares a request must pass before its
 * controller runs. Authentication and roles are added in phase 2.
 * ========================================================================== */

import { Router } from "express";
import * as sensorsController from "../controllers/sensors.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { validateObjectId } from "../middlewares/validateObjectId.middleware.js";
import { createSensorSchema, updateSensorSchema } from "../schemas/sensor.schema.js";

const router = Router();

router.get("/", sensorsController.listSensors);
router.get("/:id", validateObjectId(), sensorsController.getSensor);
router.post("/", validateBody(createSensorSchema), sensorsController.createSensor);
router.patch("/:id", validateObjectId(), validateBody(updateSensorSchema), sensorsController.updateSensor);
router.delete("/:id", validateObjectId(), sensorsController.deleteSensor);

export default router;
