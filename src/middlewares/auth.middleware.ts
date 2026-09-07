import { type NextFunction, type Request, type Response } from "express";
import { jwtVerify } from "jose";
import { ApiError } from "../lib/ApiError.js";
import { JWKS } from "../lib/jwks.js";
import { env } from "../config/env.js";
import { isKnownRole } from "../lib/roles.js";
import {
  UserReadModel,
  buildUserIdFilter,
} from "../modules/admin/user.readmodel.js";
import type { AuthUser } from "../types/express.js";

/**
 * Fetch the user's latest status and role from the database instead of
 * trusting values stored in the JWT. This ensures role changes,
 * suspensions, or deletions take effect immediately.
 *
 * Returns null if the user no longer exists.
 */
async function getCurrentUserState(
  userId: string,
): Promise<{ status: string; role: string; recruiterStatus: string } | null> {
  const doc = await UserReadModel.findOne(buildUserIdFilter(userId))
    .select("status role recruiterStatus")
    .lean();

  if (!doc) return null;

  return {
    status: (doc.status as string) || "active",
    role: (doc.role as string) || "user",
    recruiterStatus: (doc.recruiterStatus as string) || "not_applicable",
  };
}

export async function protect(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(new ApiError(401, "Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    next(new ApiError(401, "Missing bearer token"));
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.CLIENT_URL,
      audience: env.CLIENT_URL,
    });

    if (!payload.sub || !payload.email) {
      next(new ApiError(401, "Token is missing required claims"));
      return;
    }

    const current = await getCurrentUserState(payload.sub);

    if (!current) {
      next(new ApiError(401, "Account no longer exists"));
      return;
    }

    const { status, role, recruiterStatus } = current;

    if (status === "suspended") {
      next(
        new ApiError(
          403,
          "Your account has been suspended. Please contact support.",
        ),
      );
      return;
    }

    // Reject roles that are not part of the application's allowed role set.
    if (!isKnownRole(role)) {
      next(
        new ApiError(
          403,
          "Your account role is not recognized. Please contact support.",
        ),
      );
      return;
    }

    const user: AuthUser = {
      id: payload.sub,
      email: payload.email as string,
      role,
      status,
      recruiterStatus,
      ...(typeof payload.name === "string" ? { name: payload.name } : {}),
      ...(typeof payload.image === "string" ? { image: payload.image } : {}),
    };

    req.user = user;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

/**
 * Optional authentication middleware.
 *
 * Attaches `req.user` when a valid, active user token is provided.
 * Otherwise, continues the request as anonymous without returning
 * an authentication error.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    next();
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.CLIENT_URL,
      audience: env.CLIENT_URL,
    });

    if (!payload.sub || !payload.email) {
      next();
      return;
    }

    // Re-fetch the latest user status and role so account changes
    // take effect immediately, even on public routes.
    const current = await getCurrentUserState(payload.sub);

    if (!current || current.status === "suspended") {
      next();
      return;
    }

    const { status, role, recruiterStatus } = current;

    // Public routes cannot reject requests, so treat unknown roles
    // as anonymous users instead of trusting the role value.
    if (!isKnownRole(role)) {
      next();
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email as string,
      role,
      status,
      recruiterStatus,
      ...(typeof payload.name === "string" ? { name: payload.name } : {}),
      ...(typeof payload.image === "string" ? { image: payload.image } : {}),
    };
  } catch {
    // Ignore invalid or expired tokens and continue as an anonymous request.
  }

  next();
}
