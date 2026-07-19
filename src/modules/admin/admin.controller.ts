import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { ApiError } from "../../lib/ApiError.js";
import { requireParam } from "../../lib/params.js";
import * as adminService from "./admin.service.js";
import { type ListUsersQuery } from "./admin.service.js";
import * as testimonialService from "../testimonials/testimonial.service.js";
import { type ListTestimonialsQuery } from "../testimonials/testimonial.service.js";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListUsersQuery;
  const result = await adminService.listUsers(q);
  new ApiResponse(result).send(res);
});

export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");

    if (req.user?.id === id) {
      throw new ApiError(400, "You can't change your own account status");
    }

    const status = req.body.status as "active" | "suspended";
    const user = await adminService.updateUserStatus(id, status);
    new ApiResponse(
      user,
      status === "suspended" ? "User suspended" : "User reactivated",
    ).send(res);
  },
);

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");

  if (req.user?.id === id) {
    throw new ApiError(400, "You can't delete your own account");
  }

  await adminService.deleteUser(id);
  new ApiResponse(null, "User deleted").send(res);
});

export const listTestimonials = asyncHandler(
  async (req: Request, res: Response) => {
    const q = req.query as unknown as ListTestimonialsQuery;
    const result = await testimonialService.adminList(q);
    new ApiResponse(result).send(res);
  },
);

export const updateTestimonialStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const testimonial = await testimonialService.updateStatus(
      id,
      req.body.status,
    );
    new ApiResponse(testimonial, "Testimonial updated").send(res);
  },
);

export const getSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await adminService.getSettings();
    new ApiResponse(settings).send(res);
  },
);

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await adminService.updateSettings(req.body);
    new ApiResponse(settings, "Settings updated").send(res);
  },
);
