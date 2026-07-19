import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as controller from "./testimonial.controller.js";
import {
  listApprovedQuerySchema,
  submitTestimonialSchema,
} from "./testimonial.validators.js";

const router = Router();

// Only approved testimonials are returned by the service layer.
router.get("/", validate(listApprovedQuerySchema), controller.listApproved);

// Authentication is required, and submissions are reviewed before publication.
router.post("/", protect, validate(submitTestimonialSchema), controller.submit);

export default router;
