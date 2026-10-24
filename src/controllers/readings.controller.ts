/* ============================================================================
 * Readings controller
 * Hands the validated request to the readings service and wraps the result
 * in the success envelope. Errors (404, 409, 400) reach the error handler.
 * ========================================================================== */

import { Request, Response } from "express";
import { readingsService } from "../services/readings.service.js";
import type { ListReadingsQuery } from "../schemas/reading.schema.js";

export const createReading = async (req: Request, res: Response) => {
  const reading = await readingsService.create(req.body);
  res.status(201).json({ status: "success", data: reading });
};

export const getReading = async (req: Request<{ id: string }>, res: Response) => {
  const reading = await readingsService.getById(req.params.id);
  res.status(200).json({ status: "success", data: reading });
};

// req.query already holds the values parsed by listReadingsQuerySchema
// (numbers, booleans, dates), but Express still types it as raw strings,
// hence the cast. originalUrl keeps the filters for the pagination links.
export const listReadings = async (req: Request, res: Response) => {
  const result = await readingsService.list(req.query as unknown as ListReadingsQuery, req.originalUrl);
  res.status(200).json({ status: "success", ...result });
};
