import { ApiError } from "../../../lib/ApiError.js";
import { AiUsage } from "../aiUsage.model.js";
import { generateJSON } from "../provider.js";
import {
  buildCareerAdvisorPrompt,
  CAREER_ADVISOR_SCHEMA_HINT,
} from "./career-advisor.prompt.js";
import {
  type CareerAdvisorInput,
  type CareerAdvisorResult,
  careerAdvisorResultSchema,
} from "./career-advisor.validators.js";

const STRICT_JSON_REMINDER =
  "\n\nIMPORTANT: Your previous response was not valid JSON or did not match " +
  "the required shape. Return ONLY valid JSON, no markdown fences, no " +
  "commentary, no trailing text — the entire response body must be a single " +
  "parseable JSON object.";

/**
 * Generates a response and validates it against the expected schema.
 * Throws if the response is invalid or does not match the required format.
 */
async function attemptGeneration(prompt: string): Promise<CareerAdvisorResult> {
  const raw = await generateJSON(prompt, CAREER_ADVISOR_SCHEMA_HINT);
  return careerAdvisorResultSchema.parse(raw);
}

export async function getCareerAdvice(
  input: CareerAdvisorInput,
  userId: string,
): Promise<CareerAdvisorResult> {
  // Pull the user's own recent history for this feature so the request is
  // context-aware rather than generated in a vacuum, and so exclusions
  // persist across sessions rather than just within the current one.
  const history = await AiUsage.find({ userId, feature: "career-advisor" })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  const previousRoles = [
    ...new Set(history.flatMap((h) => h.bestMatchingRoles ?? [])),
  ];
  const previousSkillGaps = [
    ...new Set(history.flatMap((h) => h.skillGaps ?? [])),
  ];
  const persistedExclusions = [
    ...new Set(history.flatMap((h) => h.excludedRoles ?? [])),
  ];
  const excludeRoles = [
    ...new Set([...input.excludeRoles, ...persistedExclusions]),
  ];

  const prompt = buildCareerAdvisorPrompt(
    { ...input, excludeRoles },
    { previousRoles, previousSkillGaps },
  );

  let result: CareerAdvisorResult;

  try {
    result = await attemptGeneration(prompt);
  } catch {
    try {
      result = await attemptGeneration(prompt + STRICT_JSON_REMINDER);
    } catch {
      throw new ApiError(
        502,
        "The AI provider did not return a usable response. Please try again.",
        false,
      );
    }
  }

  // Await usage logging to ensure the record is persisted before completion.
  await AiUsage.create({
    userId,
    feature: "career-advisor",
    targetRole: input.targetRole,
    bestMatchingRoles: result.bestMatchingRoles,
    skillGaps: result.skillGaps.map((g) => g.skill),
    excludedRoles: excludeRoles,
    ...(input.focusSkill ? { focusSkill: input.focusSkill } : {}),
  });

  return result;
}

export interface CareerAdvisorHistoryEntry {
  targetRole?: string;
  bestMatchingRoles: string[];
  skillGaps: string[];
  excludedRoles: string[];
  focusSkill?: string;
  createdAt: Date;
}

/**
 * Returns the user's last 5 career-advisor requests, so the frontend can
 * surface "previously explored" context to make context-awareness visible.
 */
export async function getHistory(
  userId: string,
): Promise<CareerAdvisorHistoryEntry[]> {
  const history = await AiUsage.find({ userId, feature: "career-advisor" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return history.map((h) => ({
    ...(h.targetRole ? { targetRole: h.targetRole } : {}),
    bestMatchingRoles: h.bestMatchingRoles ?? [],
    skillGaps: h.skillGaps ?? [],
    excludedRoles: h.excludedRoles ?? [],
    ...(h.focusSkill ? { focusSkill: h.focusSkill } : {}),
    createdAt: h.createdAt,
  }));
}
