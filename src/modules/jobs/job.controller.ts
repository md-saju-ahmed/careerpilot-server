import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { requireParam } from "../../lib/params.js";
import * as jobService from "./job.service.js";
import { type ListJobsQuery } from "./job.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListJobsQuery;
  const result = await jobService.listJobs(q, req.user?.id, req.user?.role);
  new ApiResponse(result).send(res);
});

export const listSaved = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };
  const result = await jobService.getSavedJobs(req.user!.id, page, limit);
  new ApiResponse(result).send(res);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const slug = requireParam(req.params.slug, "slug");
  const result = await jobService.getJobBySlug(
    slug,
    req.user?.id,
    req.user?.role,
  );
  new ApiResponse(result).send(res);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.createJob(req.body, req.user!.id);
  new ApiResponse(job, "Job created").send(res, 201);
});

export const toggleSave = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const result = await jobService.toggleSaveJob(id, req.user!.id);
  new ApiResponse(result, result.saved ? "Job saved" : "Job unsaved").send(res);
});

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const result = await jobService.applyToJob(id, req.user!.id);
  new ApiResponse(result, "Application submitted").send(res, 201);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  await jobService.deleteJob(id);
  new ApiResponse(null, "Job deleted").send(res);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const recruiterStatus =
    req.user?.role === "admin" ? "admin" : req.user?.recruiterStatus;
  const job = await jobService.updateJob(id, req.body, recruiterStatus);
  new ApiResponse(job, "Job updated").send(res);
});

export async function resolveJobOwner(req: Request): Promise<string | null> {
  const id = requireParam(req.params.id, "id");
  return jobService.getJobOwnerId(id);
}
