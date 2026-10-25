/* ============================================================================
 * Reading model
 * Readings are a history: they are created and read, never modified.
 * ========================================================================== */

import { Schema, model } from "mongoose";
import type { IReading } from "../types/reading.types.js";

const readingSchema = new Schema<IReading>(
  {
    sensor: { type: Schema.Types.ObjectId, ref: "Sensor", required: [true, "sensor is required"] },
    value: { type: Number, required: [true, "value is required"] },
    unit: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // No default on purpose: the service must always decide it.
    isAnomalous: { type: Boolean, required: true },
  },
  { timestamps: true, versionKey: false },
);
// createdAt stores when it was saved to the database
// timestamp stores when it was measured.

// Speeds up the most common query: the latest readings of one sensor.
readingSchema.index({ sensor: 1, timestamp: -1 });

export const Reading = model<IReading>("Reading", readingSchema);
