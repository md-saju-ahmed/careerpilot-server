import { type ResumeInput } from "./resume.validators.js";

export function buildResumePrompt(input: ResumeInput): string {
  return `You are a professional resume writer. Generate a complete, ATS-friendly resume with these sections in order:
1. PROFESSIONAL SUMMARY
2. SKILLS
3. WORK EXPERIENCE
4. EDUCATION
5. ACHIEVEMENTS (only if achievements are provided)

Use plain text with clear section headers in ALL CAPS. Use hyphens for bullets.
Do not use markdown, JSON, or HTML.

Candidate information:
- Name: ${input.name}
- Target role: ${input.targetRole}
- Skills: ${input.skills || "Not specified"}
- Work experience: ${input.experience || "Not specified"}
- Education: ${input.education || "Not specified"}
${input.achievements ? `- Achievements / certifications: ${input.achievements}` : ""}

Rules:
- Write in plain text only — no markdown, no JSON, no HTML
- Be specific and results-driven, not generic
- Use active voice and strong action verbs
- Keep it concise and scannable
- Do not invent facts not present in the candidate information

Respond with ONLY the resume content.`;
}
