import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const updateApplicationStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum([
      "applied",
      "reviewing",
      "shortlisted",
      "rejected",
      "hired",
    ]),
  }),
});

export const listApplicantsQuerySchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const listMyApplicationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>["body"];
