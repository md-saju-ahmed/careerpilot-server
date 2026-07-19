import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../lib/ApiError.js";

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "Not authenticated"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ApiError(403, "You do not have permission to perform this action"),
      );
      return;
    }

    next();
  };
}
