import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireOwnership } from "../../middlewares/ownership.middleware.js";
import { requireRecruiterApproved } from "../../middlewares/requireRecruiterApproved.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import * as controller from "./application.controller.js";
import {
  listApplicantsQuerySchema,
  listMyApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "./application.validators.js";
import { resolveJobOwner } from "../jobs/job.controller.js";

const router = Router();

/**
 * GET /applications/mine — job-seeker's own applications.
 * Must be defined before /:id/status to avoid route shadowing.
 */
router.get(
  "/mine",
  protect,
  requireRole("user"),
  validate(listMyApplicationsQuerySchema),
  controller.listMine,
);

/**
 * PATCH /applications/:id/status — recruiter updates an applicant's status.
 * Ownership is checked against the parent job's createdBy.
 */
router.patch(
  "/:id/status",
  protect,
  requireRecruiterApproved,
  validate(updateApplicationStatusSchema),
  requireOwnership(controller.resolveApplicationOwner),
  controller.updateStatus,
);

/**
 * GET /jobs/:id/applicants — recruiter views applicants for their job.
 * Note: this route is mounted under /jobs in the main router index,
 * but the controller and service live here.
 */
export function applicantsRouteHandler() {
  const applicantRouter = Router({ mergeParams: true });

  applicantRouter.get(
    "/",
    protect,
    requireRecruiterApproved,
    validate(listApplicantsQuerySchema),
    requireOwnership(resolveJobOwner),
    controller.listApplicants,
  );

  return applicantRouter;
}

export default router;
