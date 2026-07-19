import { ApiError } from "../../../lib/ApiError.js";
import { Profile } from "../../profile/profile.model.js";
import { AiUsage } from "../aiUsage.model.js";
import { generateText } from "../provider.js";
import { buildCoverLetterPrompt } from "./cover-letter.prompt.js";
import { type CoverLetterInput } from "./cover-letter.validators.js";

export interface CoverLetterResult {
  letter: string;
}

async function resolveCandidateName(
  userId: string,
  claimedName: string | undefined,
): Promise<string> {
  if (claimedName) return claimedName;

  const profile = await Profile.findOne({ userId }).select("name").lean();
  return profile?.name ?? "";
}

export async function getCoverLetter(
  input: CoverLetterInput,
  userId: string,
  claimedName: string | undefined,
): Promise<CoverLetterResult> {
  const candidateName = await resolveCandidateName(userId, claimedName);
  const prompt = buildCoverLetterPrompt(input, candidateName);

  let letter: string;

  try {
    letter = await generateText(prompt);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      502,
      "The AI provider did not return a usable response. Please try again.",
      false,
    );
  }

  await AiUsage.create({
    userId,
    feature: "cover-letter",
    targetRole: input.role,
  });

  return { letter };
}
