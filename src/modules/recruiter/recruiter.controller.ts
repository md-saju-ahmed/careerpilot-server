import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import * as recruiterService from "./recruiter.service.js";

export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await recruiterService.getOwnProfile(req.user!.id);
    new ApiResponse(profile).send(res);
  },
);

export const upsertProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await recruiterService.upsertOwnProfile(
      req.user!.id,
      req.body,
    );
    new ApiResponse(profile, "Profile updated").send(res);
  },
);
