/* ============================================================================
 * Reading request schemas
 * Body of POST /api/readings and query string of GET /api/readings.
 * ========================================================================== */

import { z } from "zod";
import { MAGNITUDES } from "../types/sensor.types.js";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export const createReadingSchema = z.object({
  sensor: z
    .string({ required_error: "sensor is required" })
    .regex(OBJECT_ID_REGEX, "sensor must be a valid id (24 hexadecimal characters)"),
  value: z
    .number({ required_error: "value is required", invalid_type_error: "value must be a number" })
    .finite("value must be a finite number"),
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

// ---------------------------------------------------------------------------
// Query string of GET /api/readings (history list)
// Everything in the URL arrives as text ("?limit=20" -> "20"),
// so numbers are converted and booleans are checked explicitly.
// ---------------------------------------------------------------------------

// Allowed sort fields: any other value is answered with 400 and never reaches MongoDB.
export const READING_SORT_FIELDS = ["timestamp", "value"];

const queryDate = (field: string) =>
  z
    .string()
    .datetime({ offset: true, message: `${field} must be an ISO 8601 date, e.g. 2026-10-22T10:30:00Z` })
    .transform((value) => new Date(value));

export const listReadingsQuerySchema = z
  .object({
    page: z.coerce.number().int("page must be an integer").min(1, "page must be 1 or more").default(1),
    limit: z.coerce
      .number()
      .int("limit must be an integer")
      .min(1, "limit must be 1 or more")
      .max(100, "limit cannot be more than 100")
      .default(20),
    sensor: z.string().regex(OBJECT_ID_REGEX, "sensor must be a valid id (24 hexadecimal characters)").optional(),
    magnitude: z.enum(MAGNITUDES).optional(),
    // z.coerce.boolean() would turn "false" into true (any non-empty text counts as true),
    // so only "true" and "false" are accepted.
    isAnomalous: z
      .enum(["true", "false"], { message: "isAnomalous must be true or false" })
      .transform((value) => value === "true")
      .optional(),
    from: queryDate("from").optional(),
    to: queryDate("to").optional(),
    sort: z
      .string()
      .trim()
      .default("-timestamp")
      .refine((sort) => READING_SORT_FIELDS.includes(sort.replace(/^-/, "")), {
        message: `sort must be one of: ${READING_SORT_FIELDS.join(", ")} (add "-" in front for descending order)`,
      }),
  })
  .refine((query) => query.from === undefined || query.to === undefined || query.from <= query.to, {
    message: "from cannot be later than to",
    path: ["from"],
  });

export type ListReadingsQuery = z.infer<typeof listReadingsQuerySchema>;
