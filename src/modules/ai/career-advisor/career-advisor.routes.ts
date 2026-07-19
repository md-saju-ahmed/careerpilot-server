import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as controller from "./career-advisor.controller.js";
import { careerAdvisorSchema } from "./career-advisor.validators.js";

const router = Router();

router.post("/", protect, validate(careerAdvisorSchema), controller.getAdvice);
router.get("/history", protect, controller.getHistory);

export default router;
