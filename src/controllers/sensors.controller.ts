/* ============================================================================
 * Sensors controller
 * Reads what it needs from the request, delegates to the service and wraps
 * the result in the success envelope. No try/catch: Express 5 forwards any
 * thrown error (e.g. NotFoundError) to the global error handler.
 * --> It shortens the controller code and delegates the error handling.
 * ========================================================================== */

import { Request, Response } from "express";
import { sensorsService } from "../services/sensors.service.js";

export const listSensors = async (_req: Request, res: Response) => {
  const sensors = await sensorsService.list();
  res.status(200).json({ status: "success", data: sensors });
};

export const getSensor = async (req: Request<{ id: string }>, res: Response) => {
  const sensor = await sensorsService.getById(req.params.id);
  res.status(200).json({ status: "success", data: sensor });
};

export const createSensor = async (req: Request, res: Response) => {
  const sensor = await sensorsService.create(req.body);
  res.status(201).json({ status: "success", data: sensor });
};

export const updateSensor = async (req: Request<{ id: string }>, res: Response) => {
  const sensor = await sensorsService.update(req.params.id, req.body);
  res.status(200).json({ status: "success", data: sensor });
};

export const deleteSensor = async (req: Request<{ id: string }>, res: Response) => {
  await sensorsService.remove(req.params.id);
  res.status(204).send();
};

// req.body is already validated by the Zod schema in the route, so we can safely pass it to the service.
// The service will throw a NotFoundError if the sensor does not exist,
// which will be caught by the global error handler and returned as a 404 response.
