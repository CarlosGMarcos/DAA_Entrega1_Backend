/* ============================================================================
 * Readings service
 * Registers readings: checks the sensor (exists, active, same unit) and
 * decides isAnomalous from the sensor's thresholds at the moment of saving.
 * ========================================================================== */

import { Reading } from "../models/reading.model.js";
import { Sensor } from "../models/sensor.model.js";
import { sensorsService } from "./sensors.service.js";
import { buildPaginationLinks, buildPaginationMeta } from "./pagination.service.js";
import { ConflictError, NotFoundError, UnitMismatchError } from "../errors/http.errors.js";
import type { CreateReadingInput, ListReadingsQuery } from "../schemas/reading.schema.js";

export const isOutOfRange = (value: number, minThreshold: number | undefined, maxThreshold: number): boolean =>
  (minThreshold !== undefined && value < minThreshold) || value > maxThreshold;

export class ReadingsService {
  async create(input: CreateReadingInput) {
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
    const reading = await Reading.findById(id).populate("sensor", "name magnitude location unit").exec();
    if (!reading) {
      throw new NotFoundError(`Reading not found: ${id}`);
    }
    return reading;
  }

  // History list. The query arrives already validated and converted by
  // listReadingsQuerySchema; the original URL is only used to build the links.
  async list(query: ListReadingsQuery, originalUrl: string) {
    const filter = await this.buildFilter(query);

    const isDesc = query.sort.startsWith("-");
    const sortField = isDesc ? query.sort.slice(1) : query.sort;
    const direction = isDesc ? -1 : 1;
    const skip = (query.page - 1) * query.limit;

    // Data and total are two independent queries, so they run in parallel.
    const [data, total] = await Promise.all([
      Reading.find(filter)
        // _id breaks ties (two readings with the same value or timestamp), so
        // the order is stable and no reading repeats or vanishes between pages.
        .sort({ [sortField]: direction, _id: direction })
        .skip(skip)
        .limit(query.limit)
        .populate("sensor", "name magnitude location unit")
        .lean()
        .exec(),
      Reading.countDocuments(filter).exec(),
    ]);

    const meta = buildPaginationMeta(total, query.page, query.limit);

    return {
      data,
      meta,
      links: buildPaginationLinks(originalUrl, query.page, query.limit, meta.totalPages),
    };
  }

  // Every filter present adds one condition (logical AND). A condition is only
  // added when its parameter arrived, so MongoDB never gets an empty "{}".
  private async buildFilter(query: ListReadingsQuery): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};

    // The magnitude lives in the sensor, not in the reading. Two steps: first
    // the ids of the sensors with that magnitude, then readings with $in.
    // sensor and magnitude can come together: { $eq, $in } means both.
    const sensorCondition: Record<string, unknown> = {};
    if (query.sensor) {
      sensorCondition.$eq = query.sensor;
    }
    if (query.magnitude) {
      sensorCondition.$in = await Sensor.find({ magnitude: query.magnitude }).distinct("_id");
    }
    if (Object.keys(sensorCondition).length > 0) {
      filter.sensor = sensorCondition;
    }

    // false is a valid filter value, so compare with undefined, not truthiness.
    if (query.isAnomalous !== undefined) {
      filter.isAnomalous = query.isAnomalous;
    }

    if (query.from || query.to) {
      const timestampCondition: Record<string, Date> = {};
      if (query.from) {
        timestampCondition.$gte = query.from;
      }
      if (query.to) {
        timestampCondition.$lte = query.to;
      }
      filter.timestamp = timestampCondition;
    }

    return filter;
  }
}

export const readingsService = new ReadingsService();
