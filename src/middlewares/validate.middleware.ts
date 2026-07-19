import { type NextFunction, type Request, type Response } from "express";
import { type ZodType, ZodError } from "zod";
import { ApiError } from "../lib/ApiError.js";

/**
 * Validates request body, params, and query data using a Zod schema.
 * On success, parsed values are assigned back to the request object.
 * On failure, returns a 400 validation error.
 */
export function validate<T extends ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as unknown as Partial<Record<"body" | "params" | "query", unknown>>;

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) {
        req.params = parsed.params as Request["params"];
      }
      if (parsed.query !== undefined) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join(".") || "(root)",
          message: issue.message,
        }));
        next(new ApiError(400, "Validation failed", true, details));
        return;
      }

      next(err);
    }
  };
}
