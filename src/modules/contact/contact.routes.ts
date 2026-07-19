import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { ApiError } from "../../lib/ApiError.js";
import * as controller from "./contact.controller.js";
import {
  contactIdParamsSchema,
  listContactQuerySchema,
  submitContactSchema,
} from "./contact.validators.js";

const router = Router();

// Apply rate limiting to the public contact form to help prevent spam.
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many messages sent. Please try again later."));
  },
});

router.post(
  "/",
  contactFormLimiter,
  validate(submitContactSchema),
  controller.submit,
);

router.get(
  "/",
  protect,
  requireRole("admin"),
  validate(listContactQuerySchema),
  controller.list,
);

router.patch(
  "/:id",
  protect,
  requireRole("admin"),
  validate(contactIdParamsSchema),
  controller.toggleResolved,
);

export default router;
