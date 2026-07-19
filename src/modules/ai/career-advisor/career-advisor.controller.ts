import { type Request, type Response } from "express";
import { asyncHandler } from "../../../lib/asyncHandler.js";
import { ApiResponse } from "../../../lib/ApiResponse.js";
import * as careerAdvisorService from "./career-advisor.service.js";
import { type CareerAdvisorInput } from "./career-advisor.validators.js";

export const getAdvice = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CareerAdvisorInput;
  const result = await careerAdvisorService.getCareerAdvice(
    input,
    req.user!.id,
  );
  new ApiResponse(result).send(res);
});
