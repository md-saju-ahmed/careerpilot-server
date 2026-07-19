import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid entry id");

const yearField = z
  .string()
  .trim()
  .regex(/^(19|20)\d{2}$|^Present$/, 'Must be a 4-digit year or "Present"');

export const entryIdParamsSchema = z.object({
  params: z.object({ entryId: objectId }),
});

export const personalInfoSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(20),
    role: z.string().trim().min(2).max(80),
    address: z.string().trim().min(2).max(120),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
    avatarUrl: z.string().trim().url().optional(),
  }),
});

export const skillsSchema = z.object({
  body: z.object({
    skills: z.array(z.string().trim().min(1).max(40)).max(50),
  }),
});

const educationFieldsSchema = z.object({
  institution: z.string().trim().min(2).max(120),
  degree: z.string().trim().min(2).max(80),
  fieldOfStudy: z.string().trim().min(2).max(80),
  startYear: yearField,
  endYear: yearField,
});

export const addEducationSchema = z.object({ body: educationFieldsSchema });
export const updateEducationSchema = z.object({
  params: z.object({ entryId: objectId }),
  body: educationFieldsSchema.partial(),
});

const experienceFieldsSchema = z.object({
  title: z.string().trim().min(2).max(80),
  company: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(80),
  startDate: z.string().trim().min(4).max(20),
  endDate: z.string().trim().min(4).max(20),
  description: z.string().trim().max(2000).optional(),
});

export const addExperienceSchema = z.object({ body: experienceFieldsSchema });
export const updateExperienceSchema = z.object({
  params: z.object({ entryId: objectId }),
  body: experienceFieldsSchema.partial(),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>["body"];
export type EducationInput = z.infer<typeof addEducationSchema>["body"];
export type ExperienceInput = z.infer<typeof addExperienceSchema>["body"];
