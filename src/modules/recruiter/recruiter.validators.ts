import { z } from "zod";

export const recruiterProfileSchema = z.object({
  body: z.object({
    companyName: z.string().trim().min(2).max(100),
    companyWebsite: z.string().trim().url().optional(),
    companySize: z.string().trim().max(50).optional(),
    industry: z.string().trim().max(80).optional(),
    logoUrl: z.string().trim().url().optional(),
    description: z.string().trim().max(2000).optional(),
    verificationNote: z.string().trim().min(1).max(1000),
  }),
});

export const updateRecruiterProfileSchema = z.object({
  body: z
    .object({
      companyName: z.string().trim().min(2).max(100),
      companyWebsite: z.string().trim().url().optional().nullable(),
      companySize: z.string().trim().max(50).optional().nullable(),
      industry: z.string().trim().max(80).optional().nullable(),
      logoUrl: z.string().trim().url().optional().nullable(),
      description: z.string().trim().max(2000).optional().nullable(),
      verificationNote: z.string().trim().min(1).max(1000),
    })
    .partial(),
});

export type RecruiterProfileInput = z.infer<
  typeof recruiterProfileSchema
>["body"];
export type UpdateRecruiterProfileInput = z.infer<
  typeof updateRecruiterProfileSchema
>["body"];
