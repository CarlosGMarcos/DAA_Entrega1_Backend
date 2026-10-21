/* ============================================================================
 * Auth routes, mounted at /api/auth
 * Public on purpose: they are how a client gets a token in the first place.
 * ========================================================================== */

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);

export default router;
