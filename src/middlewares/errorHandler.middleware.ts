import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import { env } from "../config/env.js";

/**
 * Global error handler.
 * Must be registered after all routes and middleware.
 * Returns a consistent error response format.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = "Something went wrong";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    details = err.details;

    if (err.isOperational) {
      message = err.message;
    } else {
      console.error("Non-operational error:", err);
      message = env.NODE_ENV === "development" ? err.message : message;
    }
  } else if (err instanceof Error) {
    console.error("Unhandled error:", err);
    message = env.NODE_ENV === "development" ? err.message || message : message;
  } else {
    console.error("Unhandled non-Error thrown:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
