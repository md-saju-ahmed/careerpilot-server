import { z } from "zod";

export const COVER_LETTER_TONES = [
  "Professional",
  "Friendly",
  "Enthusiastic",
  "Formal",
  "Concise",
] as const;

export const COVER_LETTER_LENGTHS = ["Short", "Medium", "Long"] as const;

export const coverLetterSchema = z.object({
  body: z.object({
    company: z.string().trim().min(2).max(80),
    role: z.string().trim().min(2).max(80),
    skills: z.string().trim().max(300).optional().default(""),
    experience: z.string().trim().max(300).optional().default(""),
    tone: z.enum(COVER_LETTER_TONES),
    length: z.enum(COVER_LETTER_LENGTHS),
    regenerate: z.boolean().optional(),
  }),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>["body"];
