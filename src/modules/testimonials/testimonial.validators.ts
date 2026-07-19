import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const submitTestimonialSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    review: z.string().trim().min(10).max(1000),
  }),
});

export const listApprovedQuerySchema = z.object({
  query: z.object({
    status: z.enum(["approved"]).optional(),
    limit: z.coerce.number().int().positive().max(50).default(12),
  }),
});

export const adminListTestimonialsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const testimonialIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const updateTestimonialStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
  }),
});

export type SubmitTestimonialInput = z.infer<
  typeof submitTestimonialSchema
>["body"];
