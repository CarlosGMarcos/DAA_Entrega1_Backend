/* ============================================================================
 * Sensor model (Mongoose)
 * How a sensor is stored in the "sensors" collection. The unit is filled in
 * from the magnitude and the threshold range is checked before every save.
 * ========================================================================== */

import { Schema, model } from "mongoose";
import { MAGNITUDES, MAGNITUDE_UNITS, type ISensor } from "../types/sensor.types.js";

const sensorSchema = new Schema<ISensor>(
  {
    name: { type: String, required: [true, "name is required"], trim: true, maxlength: 100 },
    magnitude: { type: String, enum: MAGNITUDES, required: [true, "magnitude is required"] },
    location: { type: String, required: [true, "location is required"], trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true },
    minThreshold: { type: Number },
    maxThreshold: { type: Number, required: [true, "maxThreshold is required"] },
    unit: { type: String },
  },
  { timestamps: true, versionKey: false },
);

// Runs before validation on every save(): derive the unit and check the range.
sensorSchema.pre("validate", function () {
  this.unit = MAGNITUDE_UNITS[this.magnitude];

  if (this.minThreshold !== undefined && this.minThreshold >= this.maxThreshold) {
    this.invalidate("minThreshold", "minThreshold must be lower than maxThreshold");
  }
});

export const Sensor = model<ISensor>("Sensor", sensorSchema);
