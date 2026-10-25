/* ============================================================================
 * Sensors service
 * Business logic for sensors. It does not depend on Express: controllers turn
 * its results and errors into HTTP responses.
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
  // pre("validate") hook runs: the unit is set again and the range
  // is checked against the values already stored.
  async update(id: string, input: UpdateSensorInput) {
    const sensor = await this.getById(id);
    sensor.set(input);
    return sensor.save();
  }

  async remove(id: string) {
    const sensor = await this.getById(id);
    // Readings reference their sensor: deleting it would leave them pointing to a sensor that no longer exists.
    if (await Reading.exists({ sensor: sensor._id })) {
      throw new ConflictError(`Sensor ${id} has readings and cannot be deleted; deactivate it instead`);
    }
    await sensor.deleteOne();
  }
}

export const sensorsService = new SensorsService();
