import { z } from "zod";

export const userIdParamsSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    status: z.enum(["active", "suspended"]),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

export const updateSettingsSchema = z.object({
  body: z
    .object({
      siteName: z.string().trim().min(2).max(80),
      supportEmail: z.string().trim().email(),
      maintenanceMode: z.boolean(),
      allowRegistrations: z.boolean(),
    })
    .partial(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>["body"];

export const listRecruitersQuerySchema = z.object({
  query: z.object({
    recruiterStatus: z
      .enum(["pending", "approved", "rejected", "suspended", "not_applicable"])
      .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const updateRecruiterStatusSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    recruiterStatus: z.enum(["approved", "rejected", "suspended", "pending"]),
  }),
});

export const updateJobStatusSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid job id") }),
  body: z.object({
    status: z.enum(["draft", "published", "closed"]),
  }),
});
