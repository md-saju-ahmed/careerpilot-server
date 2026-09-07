import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../lib/ApiError.js";

export function requireRecruiterApproved(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new ApiError(401, "Not authenticated"));
    return;
  }

  if (req.user.role !== "recruiter") {
    next(new ApiError(403, "You do not have permission to perform this action"));
    return;
  }

  if (req.user.recruiterStatus !== "approved") {
    next(
      new ApiError(
        403,
        "Recruiter account is not yet approved. Please wait for admin review.",
      ),
    );
    return;
  }

  next();
}
