import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../lib/ApiError.js";

export function notFound(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
