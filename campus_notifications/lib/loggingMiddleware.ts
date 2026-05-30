import type { Request, Response, NextFunction } from "express";
import { Log } from "./logger";

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const message = `${req.method} ${req.originalUrl}`;
  Log("backend", "info", "middleware", message);
  next();
};
