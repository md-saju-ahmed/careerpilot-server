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
  const prompt = buildCareerAdvisorPrompt(input);

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
  });

  return result;
}
