import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as controller from "./resume.controller.js";
import { resumeSchema } from "./resume.validators.js";

const router = Router();

router.post("/", protect, validate(resumeSchema), controller.build);

export default router;
