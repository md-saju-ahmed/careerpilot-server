import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import * as controller from "./cover-letter.controller.js";
import { coverLetterSchema } from "./cover-letter.validators.js";

const router = Router();

router.post("/", protect, validate(coverLetterSchema), controller.getLetter);

export default router;
