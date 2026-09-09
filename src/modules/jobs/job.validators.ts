import { z } from "zod";
import { EMPLOYMENT_TYPES } from "./job.model.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/** Converts a single query value into an array for consistent validation. */
const toArray = (val: unknown): unknown =>
  val === undefined ? undefined : Array.isArray(val) ? val : [val];

export const listJobsQuerySchema = z.object({
  query: z.object({
    query: z.string().trim().min(1).optional(),
    category: z
      .preprocess(toArray, z.array(z.string().trim().min(1)))
      .optional(),
    location: z.string().trim().min(1).optional(),
    experience: z.string().trim().min(1).optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    salaryMin: z.coerce.number().nonnegative().optional(),
    skills: z.preprocess(toArray, z.array(z.string().trim().min(1))).optional(),

    /** Returns only jobs created by the authenticated user. */
    mine: z
      .enum(["true", "false"])
      .transform((val) => val === "true")
      .optional(),

    sort: z.enum(["newest", "salary", "title"]).default("newest"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(8),
  }),
});

export const listSavedJobsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(8),
  }),
});

export const jobSlugParamsSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1) }),
});

export const jobIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const addJobSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(120),
      company: z.string().trim().min(2).max(80),
      companyLogo: z.string().trim().url().optional(),
      location: z.string().trim().min(2).max(80),
      category: z.string().trim().min(1).max(40),
      employmentType: z.enum(EMPLOYMENT_TYPES),
      experience: z.string().trim().min(1).max(60),
      salaryMin: z.coerce.number().nonnegative().optional(),
      salaryMax: z.coerce.number().nonnegative().optional(),
      skills: z.array(z.string().trim().min(1)).min(1).max(20),
      shortDescription: z.string().trim().min(10).max(160),
      description: z.string().trim().min(30).max(20000),
      deadline: z
        .string()
        .trim()
        .refine(
          (val) => !Number.isNaN(Date.parse(val)),
          "deadline must be a valid date",
        )
        .optional(),
    })
    .refine(
      (data) =>
        data.salaryMin === undefined ||
        data.salaryMax === undefined ||
        data.salaryMin <= data.salaryMax,
      {
        message: "salaryMin must be less than or equal to salaryMax",
        path: ["salaryMin"],
      },
    ),
});

export type AddJobInput = z.infer<typeof addJobSchema>["body"];

export const updateJobSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      title: z.string().trim().min(2).max(120),
      company: z.string().trim().min(2).max(80),
      companyLogo: z.string().trim().url().optional().nullable(),
      location: z.string().trim().min(2).max(80),
      category: z.string().trim().min(1).max(40),
      employmentType: z.enum(EMPLOYMENT_TYPES),
      experience: z.string().trim().min(1).max(60),
      salaryMin: z.coerce.number().nonnegative().optional().nullable(),
      salaryMax: z.coerce.number().nonnegative().optional().nullable(),
      skills: z.array(z.string().trim().min(1)).min(1).max(20),
      shortDescription: z.string().trim().min(10).max(160),
      description: z.string().trim().min(30).max(20000),
      deadline: z
        .string()
        .trim()
        .refine(
          (val) => !Number.isNaN(Date.parse(val)),
          "deadline must be a valid date",
        )
        .optional()
        .nullable(),
      status: z.enum(["draft", "published", "closed"]).optional(),
    })
    .partial()
    .refine(
      (data) =>
        data.salaryMin == null ||
        data.salaryMax == null ||
        data.salaryMin <= data.salaryMax,
      {
        message: "salaryMin must be less than or equal to salaryMax",
        path: ["salaryMin"],
      },
    ),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>["body"];
