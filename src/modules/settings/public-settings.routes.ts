import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { getPublicSettings } from "../admin/admin.service.js";

const router = Router();

/**
 * GET /api/settings
 *
 * Public endpoint used by client-facing features such as:
 * - Site configuration (e.g., site title)
 * - Maintenance mode checks
 * - Registration form settings
 *
 * Authentication is intentionally not required because these features
 * must be accessible before a user signs in.
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await getPublicSettings();
    new ApiResponse(settings).send(res);
  }),
);

export default router;
