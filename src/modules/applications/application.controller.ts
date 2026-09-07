import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { requireParam } from "../../lib/params.js";
import * as applicationService from "./application.service.js";

export const listApplicants = asyncHandler(
  async (req: Request, res: Response) => {
    const jobId = requireParam(req.params.id, "id");
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const result = await applicationService.listApplicants(jobId, page, limit);
    new ApiResponse(result).send(res);
  },
);

export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const result = await applicationService.updateApplicationStatus(
      id,
      req.body,
    );
    new ApiResponse(result, "Application status updated").send(res);
  },
);

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };
  const result = await applicationService.listMyApplications(
    req.user!.id,
    page,
    limit,
  );
  new ApiResponse(result).send(res);
});

export async function resolveApplicationOwner(
  req: Request,
): Promise<string | null> {
  const id = requireParam(req.params.id, "id");
  return applicationService.getApplicationJobOwnerId(id);
}
