/* ============================================================================
 * Reading request schema (Zod)
 * What a client may send to register a reading. isAnomalous is not here: the
 * server always decides it, so a value sent by the client is stripped.
 * ========================================================================== */

import { z } from "zod";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export const createReadingSchema = z.object({
  sensor: z.string({ required_error: "sensor is required" }).regex(OBJECT_ID_REGEX, "sensor must be a valid id (24 hexadecimal characters)"),
  value: z.number({ required_error: "value is required", invalid_type_error: "value must be a number" }).finite("value must be a finite number"),
  unit: z.string().trim().min(1, "unit cannot be empty").optional(),
  timestamp: z
    .string()
    .datetime({ offset: true, message: "timestamp must be an ISO 8601 date, e.g. 2026-10-22T10:30:00Z" })
    .transform((value) => new Date(value))
    // Checked on every request (not once at startup), with one minute of
    // margin for clocks that are slightly ahead.
    .refine((date) => date.getTime() <= Date.now() + 60_000, "timestamp cannot be in the future")
    .optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
