import { ApiError } from "../../lib/ApiError.js";
import { RecruiterProfile } from "./recruiter.model.js";
import type { UpdateRecruiterProfileInput } from "./recruiter.validators.js";

export async function getOwnProfile(userId: string) {
  const profile = await RecruiterProfile.findOne({ userId });

  if (!profile) {
    throw new ApiError(
      404,
      "Recruiter profile not found. Please create one first.",
    );
  }

  return profile.toJSON();
}

export async function upsertOwnProfile(
  userId: string,
  input: UpdateRecruiterProfileInput,
) {
  const profile = await RecruiterProfile.findOneAndUpdate(
    { userId },
    { $set: input },
    { returnDocument: "after", upsert: true, runValidators: true },
  );

  return profile.toJSON();
}
