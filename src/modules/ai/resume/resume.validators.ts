import { z } from "zod";

export const resumeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    targetRole: z.string().trim().min(2).max(80),
    skills: z.string().trim().max(400).default(""),
    experience: z.string().trim().max(600).default(""),
    education: z.string().trim().max(300).default(""),
    achievements: z.string().trim().max(400).default(""),
  }),
});

export type ResumeInput = z.infer<typeof resumeSchema>["body"];
