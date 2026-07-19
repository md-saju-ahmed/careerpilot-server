import { z } from "zod";
import { CATEGORY_ICONS } from "./category.model.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const categoryIdParamsSchema = z.object({
  params: z.object({ id: objectId }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(40),
    icon: z.enum(CATEGORY_ICONS),
    order: z.coerce.number().int().nonnegative().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(40),
      icon: z.enum(CATEGORY_ICONS),
      order: z.coerce.number().int().nonnegative(),
    })
    .partial(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
