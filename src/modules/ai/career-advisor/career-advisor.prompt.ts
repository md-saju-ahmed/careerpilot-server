import { type CareerAdvisorInput } from "./career-advisor.validators.js";

export const CAREER_ADVISOR_SCHEMA_HINT = `{
  "careerSummary": string,
  "bestMatchingRoles": string[],
  "skillGaps": { "skill": string, "priority": "High" | "Medium" | "Low" }[],
  "learningRoadmap": { "step": string, "topic": string }[],
  "salaryInsight": { "range": string, "note": string },
  "interviewTips": string[]
}`;

export interface CareerAdvisorPromptContext {
  previousRoles?: string[];
  previousSkillGaps?: string[];
}

export function buildCareerAdvisorPrompt(
  input: CareerAdvisorInput,
  context: CareerAdvisorPromptContext = {},
): string {
  return `You are an experienced career advisor for software and tech roles.

A candidate has given you the following information:
- Current skills: ${input.skills}
- Experience: ${input.experience || "Not specified"}
- Target role: ${input.targetRole}
${
  context.previousRoles?.length
    ? `\nIn earlier sessions, this candidate was already shown these roles: ${context.previousRoles.join(", ")}. Prefer surfacing different, complementary roles unless a repeat is genuinely the best fit.`
    : ""
}
${
  context.previousSkillGaps?.length
    ? `\nEarlier sessions flagged these skill gaps: ${context.previousSkillGaps.join(", ")}. If the candidate's stated skills now cover any of these, acknowledge the progress in "careerSummary".`
    : ""
}
${
  input.excludeRoles.length
    ? `\nThe candidate explicitly asked to exclude these roles from "bestMatchingRoles": ${input.excludeRoles.join(", ")}. Do not include them.`
    : ""
}
${
  input.focusSkill
    ? `\nThe candidate wants the advice to focus more specifically on: "${input.focusSkill}". Weight "skillGaps", "learningRoadmap", and "interviewTips" toward this area.`
    : ""
}

Think step by step, silently, about how well the candidate's current skills
and experience match the target role, what's missing, and what they should
learn next — but do NOT show your reasoning steps in the output. Only the
final JSON should appear in your response.

Based on that reasoning, respond with STRICT JSON matching exactly this
shape (no extra keys, no missing keys):

${CAREER_ADVISOR_SCHEMA_HINT}

Guidance for filling it in:
- "careerSummary": 2-4 sentences assessing the candidate's current fit for the target role.
- "bestMatchingRoles": 3-5 real job titles the candidate is a strong fit for right now, given their current skills.
- "skillGaps": 3-6 specific skills the candidate should acquire or strengthen to reach the target role, each with a priority.
- "learningRoadmap": 4-8 ordered steps, each with a short "step" label (e.g. "Step 1") and a "topic" to learn.
- "salaryInsight": a realistic salary "range" for the target role (include a currency and region assumption if relevant) and a short "note" of context.
- "interviewTips": 3-6 concrete, actionable interview tips tailored to the target role.

Respond with ONLY the JSON object — no markdown fences, no commentary.`;
}
