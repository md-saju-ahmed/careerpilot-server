import { Router } from "express";
import { optionalAuth, protect } from "../../middlewares/auth.middleware.js";
import { requireOwnership } from "../../middlewares/ownership.middleware.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { requireRecruiterApproved } from "../../middlewares/requireRecruiterApproved.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as controller from "./job.controller.js";
import {
  addJobSchema,
  jobIdParamsSchema,
  jobSlugParamsSchema,
  listJobsQuerySchema,
  listSavedJobsQuerySchema,
  updateJobSchema,
} from "./job.validators.js";

const router = Router();

router.get("/", optionalAuth, validate(listJobsQuerySchema), controller.list);

router.get(
  "/saved",
  protect,
  validate(listSavedJobsQuerySchema),
  controller.listSaved,
);

router.get(
  "/:slug",
  optionalAuth,
  validate(jobSlugParamsSchema),
  controller.getOne,
);

router.post(
  "/",
  protect,
  requireRole("recruiter"),
  requireRecruiterApproved,
  validate(addJobSchema),
  controller.create,
);

router.patch(
  "/:id/save",
  protect,
  validate(jobIdParamsSchema),
  controller.toggleSave,
);

router.post(
  "/:id/apply",
  protect,
  validate(jobIdParamsSchema),
  controller.apply,
);

router.patch(
  "/:id",
  protect,
  validate(updateJobSchema),
  requireOwnership(controller.resolveJobOwner),
  controller.update,
);

router.delete(
  "/:id",
  protect,
  validate(jobIdParamsSchema),
  requireOwnership(controller.resolveJobOwner),
  controller.remove,
);

export default router;
