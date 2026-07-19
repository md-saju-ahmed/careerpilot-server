import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

/**
 * Wraps an async route handler so a rejected promise (thrown ApiError, an
 * await failure, etc.) is forwarded to next() instead of crashing the
 * process or hanging the request. Use this on every controller function:
 *
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
