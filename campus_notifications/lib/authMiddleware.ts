import type { Request, Response, NextFunction } from "express";
import { Log } from "./logger";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    await Log("backend", "warn", "auth", "Authorization check failed: token missing or invalid");
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token format" });
  }
  next();
};
