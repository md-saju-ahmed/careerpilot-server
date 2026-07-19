import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { ApiError } from "../../lib/ApiError.js";
import * as testimonialService from "./testimonial.service.js";
import { type ListApprovedQuery } from "./testimonial.service.js";

export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Not authenticated");
  }

  const testimonial = await testimonialService.submitTestimonial(
    {
      id: req.user.id,
      ...(req.user.name !== undefined && { name: req.user.name }),
    },
    req.body,
  );
  new ApiResponse(
    testimonial,
    "Thanks for your feedback — it's pending review.",
  ).send(res, 201);
});

export const listApproved = asyncHandler(
  async (req: Request, res: Response) => {
    const q = req.query as unknown as ListApprovedQuery;
    const testimonials = await testimonialService.listApproved(q);
    new ApiResponse(testimonials).send(res);
  },
);
