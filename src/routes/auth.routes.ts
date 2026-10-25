/* ============================================================================
 * Auth routes (/api/auth)
 * Public routes: they are the way to obtain a token.
 * ========================================================================== */

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { loginLimiter } from "../middlewares/rateLimit.middleware.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);
// The limiter goes first: a blocked client gets 429 before anything else runs.
router.post("/login", loginLimiter, validateBody(loginSchema), authController.login);

export default router;
