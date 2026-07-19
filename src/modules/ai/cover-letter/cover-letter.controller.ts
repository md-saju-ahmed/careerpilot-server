import { type Request, type Response } from "express";
import { asyncHandler } from "../../../lib/asyncHandler.js";
import { ApiResponse } from "../../../lib/ApiResponse.js";
import * as coverLetterService from "./cover-letter.service.js";
import { type CoverLetterInput } from "./cover-letter.validators.js";

export const getLetter = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CoverLetterInput;
  const result = await coverLetterService.getCoverLetter(
    input,
    req.user!.id,
    req.user!.name,
  );
  new ApiResponse(result).send(res);
});
