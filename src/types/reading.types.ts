/* ============================================================================
 * Reading types
 * A reading points to its sensor by id (no sensor data is copied) and keeps
 * the unit and the anomaly flag as they were at the moment it was saved.
 * ========================================================================== */

import type { Types } from "mongoose";

export interface IReading {
  sensor: Types.ObjectId;
  value: number;
  unit: string;
  timestamp: Date;
  isAnomalous: boolean;
}

// Each reading is associated with a sensor,
// so as an identifier we store the ObjectId
// of the sensor that takes the reading.
