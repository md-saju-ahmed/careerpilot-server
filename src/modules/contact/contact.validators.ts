import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const submitContactSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    message: z.string().trim().min(10).max(2000),
  }),
});

export const listContactQuerySchema = z.object({
  query: z.object({
    resolved: z
      .enum(["true", "false"])
      .transform((val) => val === "true")
      .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const contactIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>["body"];
