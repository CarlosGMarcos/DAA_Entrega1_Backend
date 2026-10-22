/* ============================================================================
 * Sensors service
 * Business logic for sensors, independent of Express. Controllers call these
 * methods and turn the result (or the thrown error) into an HTTP response.
 * ========================================================================== */

import { Sensor } from "../models/sensor.model.js";
import { Reading } from "../models/reading.model.js";
import { ConflictError, NotFoundError } from "../errors/http.errors.js";
import type { CreateSensorInput, UpdateSensorInput } from "../schemas/sensor.schema.js";

export class SensorsService {
  async list() {
    return Sensor.find().sort({ createdAt: -1 }).exec();
  }

  async getById(id: string) {
    const sensor = await Sensor.findById(id).exec();
    if (!sensor) {
      throw new NotFoundError(`Sensor not found: ${id}`);
    }
    return sensor;
  }

  async create(input: CreateSensorInput) {
    return Sensor.create(input);
  }

  // Load, change and save (instead of findByIdAndUpdate) so the model's
  // pre("validate") hook runs: unit is re-derived and the range re-checked
  // against the values already stored.
  async update(id: string, input: UpdateSensorInput) {
    const sensor = await this.getById(id);
    sensor.set(input);
    return sensor.save();
  }

  async remove(id: string) {
    const sensor = await this.getById(id);
    // Readings point to their sensor: deleting it would leave them orphaned.
    if (await Reading.exists({ sensor: sensor._id })) {
      throw new ConflictError(`Sensor ${id} has readings and cannot be deleted; deactivate it instead`);
    }
    await sensor.deleteOne();
  }
}

export const sensorsService = new SensorsService();
