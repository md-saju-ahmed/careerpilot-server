import { type CoverLetterInput } from "./cover-letter.validators.js";

const LENGTH_GUIDANCE: Record<CoverLetterInput["length"], string> = {
  Short: "about 3 short paragraphs (roughly 120-180 words total)",
  Medium: "about 4 paragraphs (roughly 200-300 words total)",
  Long: "about 5-6 paragraphs (roughly 350-450 words total)",
};

export function buildCoverLetterPrompt(
  input: CoverLetterInput,
  candidateName: string,
): string {
  const signOffInstruction = candidateName
    ? `Close with a professional sign-off (e.g. "Sincerely,") followed by
  the candidate's real name: "${candidateName}". Do not use a placeholder.`
    : `Close with a professional sign-off (e.g. "Sincerely," followed by a
  placeholder like "[Your Name]" since the candidate's name isn't provided).`;

  return `Write a complete, ready-to-send cover letter for a job application.

Candidate details:
- Name: ${candidateName || "Not specified"}
- Applying for: ${input.role} at ${input.company}
- Relevant skills: ${input.skills || "Not specified"}
- Relevant experience: ${input.experience || "Not specified"}

Requirements:
- Tone: ${input.tone}
- Length: ${LENGTH_GUIDANCE[input.length]}
- Open with exactly: "Dear Hiring Team,"
- ${signOffInstruction}
- Write in plain text only — no markdown formatting, no headers, no bullet
  points, no JSON. Just the letter body as the candidate would send it.
- Make it specific to the role and company rather than generic boilerplate,
  weaving in the candidate's stated skills and experience naturally.

Respond with ONLY the letter text.`;
}
