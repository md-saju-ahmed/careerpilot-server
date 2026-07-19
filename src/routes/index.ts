import { Router } from "express";
import jobRoutes from "../modules/jobs/job.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import contactRoutes from "../modules/contact/contact.routes.js";
import testimonialRoutes from "../modules/testimonials/testimonial.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import careerAdvisorRoutes from "../modules/ai/career-advisor/career-advisor.routes.js";
import coverLetterRoutes from "../modules/ai/cover-letter/cover-letter.routes.js";
import publicSettingsRoutes from "../modules/settings/public-settings.routes.js";
import categoryRoutes from "../modules/categories/category.routes.js";

const router = Router();

router.use("/jobs", jobRoutes);
router.use("/profile", profileRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/contact", contactRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/admin", adminRoutes);
router.use("/ai/career-advisor", careerAdvisorRoutes);
router.use("/ai/cover-letter", coverLetterRoutes);
router.use("/settings", publicSettingsRoutes);
router.use("/categories", categoryRoutes);

export default router;
