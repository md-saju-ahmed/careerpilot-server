import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as controller from "./recruiter.controller.js";
import { updateRecruiterProfileSchema } from "./recruiter.validators.js";

const router = Router();

router.use(protect, requireRole("recruiter"));

router.get("/profile", controller.getProfile);

router.patch(
  "/profile",
  validate(updateRecruiterProfileSchema),
  controller.upsertProfile,
);

export default router;
