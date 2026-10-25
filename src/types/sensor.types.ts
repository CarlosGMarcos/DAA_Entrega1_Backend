/* ============================================================================
 * Sensor types
 * Magnitudes and their units are defined only here; the model, the schemas
 * and the services import them, so they always match.
 * ========================================================================== */

export const MAGNITUDES = ["soil_humidity", "temperature", "light"] as const;
export type Magnitude = (typeof MAGNITUDES)[number];

// The unit is decided by the magnitude the sensor measures, never by the client.
export const MAGNITUDE_UNITS: Record<Magnitude, string> = {
  soil_humidity: "%",
  temperature: "°C",
  light: "lx",
};

export interface ISensor {
  name: string;
  magnitude: Magnitude;
  location: string;
  isActive: boolean;
  minThreshold?: number;
  maxThreshold: number;
  unit: string;
}
// createdAt and updatedAt are automatically added by Mongoose when timestamps:
//    true is set in the schema options.
