import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import * as dashboardService from "./dashboard.service.js";

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await dashboardService.getSummary(
    req.user!.id,
    req.user!.role,
  );
  new ApiResponse(summary).send(res);
});

export const getPublicStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await dashboardService.getPublicStats();
    new ApiResponse(stats).send(res);
  },
);
