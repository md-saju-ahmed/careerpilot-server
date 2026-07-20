import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { requireParam } from "../../lib/params.js";
import * as profileService from "./profile.service.js";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.getOrCreateProfile(req.user!.id, {
    email: req.user!.email,
    ...(req.user!.name ? { name: req.user!.name } : {}),
    ...(req.user!.image ? { avatarUrl: req.user!.image } : {}),
  });
  new ApiResponse(profile).send(res);
});

export const updatePersonalInfo = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await profileService.updatePersonalInfo(
      req.user!.id,
      req.body,
    );
    new ApiResponse(profile, "Profile updated").send(res);
  },
);

export const replaceSkills = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await profileService.replaceSkills(
      req.user!.id,
      req.body.skills,
    );
    new ApiResponse(profile, "Skills updated").send(res);
  },
);

export const addEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await profileService.addEducation(req.user!.id, req.body);
    new ApiResponse(profile, "Education entry added").send(res, 201);
  },
);

export const updateEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const entryId = requireParam(req.params.entryId, "entryId");
    const profile = await profileService.updateEducation(
      req.user!.id,
      entryId,
      req.body,
    );
    new ApiResponse(profile, "Education entry updated").send(res);
  },
);

export const deleteEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const entryId = requireParam(req.params.entryId, "entryId");
    const profile = await profileService.deleteEducation(req.user!.id, entryId);
    new ApiResponse(profile, "Education entry deleted").send(res);
  },
);

export const addExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const profile = await profileService.addExperience(req.user!.id, req.body);
    new ApiResponse(profile, "Experience entry added").send(res, 201);
  },
);

export const updateExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const entryId = requireParam(req.params.entryId, "entryId");
    const profile = await profileService.updateExperience(
      req.user!.id,
      entryId,
      req.body,
    );
    new ApiResponse(profile, "Experience entry updated").send(res);
  },
);

export const deleteExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const entryId = requireParam(req.params.entryId, "entryId");
    const profile = await profileService.deleteExperience(
      req.user!.id,
      entryId,
    );
    new ApiResponse(profile, "Experience entry deleted").send(res);
  },
);
