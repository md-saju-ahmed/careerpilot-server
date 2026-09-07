import { type Request, type Response } from "express";
import { asyncHandler } from "../../../lib/asyncHandler.js";
import { ApiResponse } from "../../../lib/ApiResponse.js";
import { generateResume } from "./resume.service.js";

export const build = asyncHandler(async (req: Request, res: Response) => {
  const result = await generateResume(req.body, req.user!.id);
  new ApiResponse(result, "Resume generated").send(res);
});
