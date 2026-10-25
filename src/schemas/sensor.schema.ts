/* ============================================================================
 * Sensor request schemas
 * Fields the client may send to create or update a sensor. Any other field
 * (e.g. "unit" or "_id") is discarded.
 * ========================================================================== */

import { z } from "zod";
import { MAGNITUDES } from "../types/sensor.types.js";

const sensorFields = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(2, "name must have at least 2 characters")
    .max(100, "name cannot exceed 100 characters"),
  magnitude: z.enum(MAGNITUDES, {
    errorMap: () => ({ message: `magnitude must be one of: ${MAGNITUDES.join(", ")}` }),
  }),
  location: z
    .string({ required_error: "location is required" })
    .trim()
    .min(2, "location must have at least 2 characters")
    .max(100, "location cannot exceed 100 characters"),
  minThreshold: z.number({ invalid_type_error: "minThreshold must be a number" }).optional(),
  maxThreshold: z.number({
    required_error: "maxThreshold is required",
    invalid_type_error: "maxThreshold must be a number",
  }),
});

// Cross-field rule, only checked when both thresholds are present.
const thresholdsInOrder = (data: { minThreshold?: number; maxThreshold?: number }) =>
  data.minThreshold === undefined || data.maxThreshold === undefined || data.minThreshold < data.maxThreshold;

const thresholdsError = { message: "minThreshold must be lower than maxThreshold", path: ["minThreshold"] };

export const createSensorSchema = sensorFields.refine(thresholdsInOrder, thresholdsError);

// PATCH: every field optional, magnitude cannot change, isActive can.
export const updateSensorSchema = sensorFields
  .omit({ magnitude: true })
  .extend({ isActive: z.boolean({ invalid_type_error: "isActive must be true or false" }) })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Send at least one field to update" })
  .refine(thresholdsInOrder, thresholdsError);

export type CreateSensorInput = z.infer<typeof createSensorSchema>;
export type UpdateSensorInput = z.infer<typeof updateSensorSchema>;
