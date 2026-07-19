import { type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiResponse } from "../../lib/ApiResponse.js";
import { requireParam } from "../../lib/params.js";
import * as contactService from "./contact.service.js";
import { type ListContactQuery } from "./contact.service.js";

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const submission = await contactService.submitContact(req.body);
  new ApiResponse(submission, "Message sent").send(res, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListContactQuery;
  const result = await contactService.listContact(q);
  new ApiResponse(result).send(res);
});

export const toggleResolved = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const submission = await contactService.toggleResolved(id);
    new ApiResponse(submission, "Submission updated").send(res);
  },
);
