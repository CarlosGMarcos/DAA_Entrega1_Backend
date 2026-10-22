/* ============================================================================
 * Readings service
 * Registers readings: checks the sensor (exists, active, same unit) and
 * decides isAnomalous from the sensor's thresholds at the moment of saving.
 * ========================================================================== */

import { Reading } from "../models/reading.model.js";
import { sensorsService } from "./sensors.service.js";
import { ConflictError, NotFoundError, UnitMismatchError } from "../errors/http.errors.js";
import type { CreateReadingInput } from "../schemas/reading.schema.js";

// The normal range is inclusive: a value equal to a threshold is still normal.
export const isOutOfRange = (value: number, minThreshold: number | undefined, maxThreshold: number): boolean =>
  (minThreshold !== undefined && value < minThreshold) || value > maxThreshold;

export class ReadingsService {
  async create(input: CreateReadingInput) {
    // 404 if the sensor does not exist (reuses the sensors service).
    const sensor = await sensorsService.getById(input.sensor);

    if (!sensor.isActive) {
      throw new ConflictError(`Sensor ${sensor.id} is inactive and does not accept readings`);
    }

    if (input.unit !== undefined && input.unit !== sensor.unit) {
      throw new UnitMismatchError(input.unit, sensor.unit);
    }

    return Reading.create({
      sensor: sensor._id,
      value: input.value,
      unit: sensor.unit,
      timestamp: input.timestamp,
      isAnomalous: isOutOfRange(input.value, sensor.minThreshold, sensor.maxThreshold),
    });
  }

  async getById(id: string) {
    // populate swaps the stored sensor id for a few fields of the real sensor.
    const reading = await Reading.findById(id).populate("sensor", "name magnitude location unit").exec();
    if (!reading) {
      throw new NotFoundError(`Reading not found: ${id}`);
    }
    return reading;
  }
}

export const readingsService = new ReadingsService();
