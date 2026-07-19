import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../lib/ApiError.js";

/**
 * Ensures the authenticated user owns the requested resource.
 * Admin users bypass the ownership check.
 *
 * Returns:
 * - 404 if the resource does not exist
 * - 403 if the user is not the owner
 */
export function requireOwnership(
  getResourceOwnerId: (req: Request) => Promise<string | null>,
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      next(new ApiError(401, "Not authenticated"));
      return;
    }

    try {
      const ownerId = await getResourceOwnerId(req);

      if (ownerId === null) {
        next(new ApiError(404, "Resource not found"));
        return;
      }

      if (req.user.id !== ownerId && req.user.role !== "admin") {
        next(
          new ApiError(
            403,
            "You do not have permission to access this resource",
          ),
        );
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
