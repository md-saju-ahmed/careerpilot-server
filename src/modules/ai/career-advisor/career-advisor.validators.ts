import { z } from "zod";

export const careerAdvisorSchema = z.object({
  body: z.object({
    skills: z.string().trim().min(2).max(300),
    experience: z.string().trim().max(120).optional().default(""),
    targetRole: z.string().trim().min(2).max(80),
    regenerate: z.boolean().optional(),
  }),
});

export type CareerAdvisorInput = z.infer<typeof careerAdvisorSchema>["body"];

export const careerAdvisorResultSchema = z.object({
  careerSummary: z.string().min(1),
  bestMatchingRoles: z.array(z.string().min(1)).min(1),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        priority: z.enum(["High", "Medium", "Low"]),
      }),
    )
    .min(1),
  learningRoadmap: z
    .array(
      z.object({
        step: z.string().min(1),
        topic: z.string().min(1),
      }),
    )
    .min(1),
  salaryInsight: z.object({
    range: z.string().min(1),
    note: z.string().min(1),
  }),
  interviewTips: z.array(z.string().min(1)).min(1),
});

export type CareerAdvisorResult = z.infer<typeof careerAdvisorResultSchema>;
