import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as controller from "./admin.controller.js";
import {
  listUsersQuerySchema,
  updateStatusSchema,
  deleteUserSchema,
  updateSettingsSchema,
  listRecruitersQuerySchema,
  updateRecruiterStatusSchema,
  updateJobStatusSchema,
} from "./admin.validators.js";
import {
  adminListTestimonialsQuerySchema,
  updateTestimonialStatusSchema,
} from "../testimonials/testimonial.validators.js";
import {
  categoryIdParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../categories/category.validators.js";
import * as categoryController from "../categories/category.controller.js";

const router = Router();

router.use(protect, requireRole("admin"));

router.get("/users", validate(listUsersQuerySchema), controller.listUsers);

router.patch(
  "/users/:id/status",
  validate(updateStatusSchema),
  controller.updateUserStatus,
);
router.delete("/users/:id", validate(deleteUserSchema), controller.deleteUser);

router.get(
  "/recruiters",
  validate(listRecruitersQuerySchema),
  controller.listRecruiters,
);
router.patch(
  "/recruiters/:id/status",
  validate(updateRecruiterStatusSchema),
  controller.updateRecruiterStatus,
);

router.patch(
  "/jobs/:id/status",
  validate(updateJobStatusSchema),
  controller.updateJobStatus,
);

router.get(
  "/testimonials",
  validate(adminListTestimonialsQuerySchema),
  controller.listTestimonials,
);
router.patch(
  "/testimonials/:id",
  validate(updateTestimonialStatusSchema),
  controller.updateTestimonialStatus,
);

router.get("/categories", categoryController.list);
router.post(
  "/categories",
  validate(createCategorySchema),
  categoryController.create,
);
router.patch(
  "/categories/:id",
  validate(updateCategorySchema),
  categoryController.update,
);
router.delete(
  "/categories/:id",
  validate(categoryIdParamsSchema),
  categoryController.remove,
);

router.get("/settings", controller.getSettings);
router.put(
  "/settings",
  validate(updateSettingsSchema),
  controller.updateSettings,
);

export default router;
