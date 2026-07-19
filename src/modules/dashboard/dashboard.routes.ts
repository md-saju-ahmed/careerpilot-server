import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import * as controller from "./dashboard.controller.js";

const router = Router();

router.get("/summary", protect, controller.getSummary);
router.get("/public-stats", controller.getPublicStats);

export default router;
