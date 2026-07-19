import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { requireParam } from "../../lib/params.js";
import * as categoryService from "./category.service.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  new ApiResponse(categories).send(res);
});

export const listWithCounts = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await categoryService.getCategoryBreakdown();
    new ApiResponse(categories).send(res);
  },
);

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  new ApiResponse(category, "Category created").send(res, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const category = await categoryService.updateCategory(id, req.body);
  new ApiResponse(category, "Category updated").send(res);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  await categoryService.deleteCategory(id);
  new ApiResponse(null, "Category deleted").send(res);
});
