import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as controller from "./profile.controller.js";
import {
  addEducationSchema,
  addExperienceSchema,
  entryIdParamsSchema,
  personalInfoSchema,
  skillsSchema,
  updateEducationSchema,
  updateExperienceSchema,
} from "./profile.validators.js";

const router = Router();

router.use(protect);

router.get("/", controller.getProfile);
router.patch("/", validate(personalInfoSchema), controller.updatePersonalInfo);
router.put("/skills", validate(skillsSchema), controller.replaceSkills);

router.post(
  "/education",
  validate(addEducationSchema),
  controller.addEducation,
);
router.patch(
  "/education/:entryId",
  validate(updateEducationSchema),
  controller.updateEducation,
);
router.delete(
  "/education/:entryId",
  validate(entryIdParamsSchema),
  controller.deleteEducation,
);

router.post(
  "/experience",
  validate(addExperienceSchema),
  controller.addExperience,
);
router.patch(
  "/experience/:entryId",
  validate(updateExperienceSchema),
  controller.updateExperience,
);
router.delete(
  "/experience/:entryId",
  validate(entryIdParamsSchema),
  controller.deleteExperience,
);

export default router;
