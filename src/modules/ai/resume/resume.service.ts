import { ApiError } from "../../../lib/ApiError.js";
import { Profile } from "../../profile/profile.model.js";
import { AiUsage } from "../aiUsage.model.js";
import { generateText } from "../provider.js";
import { buildResumePrompt } from "./resume.prompt.js";
import { type ResumeInput } from "./resume.validators.js";

export interface ResumeResult {
  content: string;
}

async function resolveName(
  userId: string,
  claimedName: string,
): Promise<string> {
  if (claimedName.trim()) return claimedName.trim();
  const profile = await Profile.findOne({ userId }).select("name").lean();
  return profile?.name ?? "";
}

export async function generateResume(
  input: ResumeInput,
  userId: string,
): Promise<ResumeResult> {
  const resolvedName = await resolveName(userId, input.name);
  const prompt = buildResumePrompt({ ...input, name: resolvedName });

  let content: string;

  try {
    content = await generateText(prompt);
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
    feature: "resume",
    targetRole: input.targetRole,
  });

  return { content };
}
