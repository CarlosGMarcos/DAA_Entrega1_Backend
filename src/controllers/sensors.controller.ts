/* ============================================================================
 * Sensors controller
 * Passes the request to the sensors service and returns the result. There is
 * no try/catch: Express 5 sends any thrown error to the global error handler,
 * which keeps the controllers short.
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
