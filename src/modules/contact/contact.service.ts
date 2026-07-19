import { ApiError } from "../../lib/ApiError.js";
import { Contact } from "./contact.model.js";
import { type SubmitContactInput } from "./contact.validators.js";

export async function submitContact(input: SubmitContactInput) {
  const submission = await Contact.create(input);
  return submission.toJSON();
}

export interface ListContactQuery {
  resolved?: boolean;
  page: number;
  limit: number;
}

export async function listContact(query: ListContactQuery) {
  const filter =
    query.resolved === undefined ? {} : { resolved: query.resolved };
  const skip = (query.page - 1) * query.limit;

  const [submissions, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Contact.countDocuments(filter),
  ]);

  return {
    submissions: submissions.map((submission) => submission.toJSON()),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function toggleResolved(id: string) {
  const submission = await Contact.findById(id);

  if (!submission) {
    throw new ApiError(404, "Contact submission not found");
  }

  submission.resolved = !submission.resolved;
  await submission.save();
  return submission.toJSON();
}
