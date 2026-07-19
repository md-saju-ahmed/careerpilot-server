import { Document, Schema, model } from "mongoose";

export const AI_FEATURES = ["career-advisor", "cover-letter"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

export interface AiUsageDocument extends Document {
  userId: string;
  feature: AiFeature;
  targetRole?: string;
  bestMatchingRoles?: string[];
  skillGaps?: string[];
  excludedRoles?: string[];
  focusSkill?: string;
  createdAt: Date;
}

const aiUsageSchema = new Schema<AiUsageDocument>({
  userId: { type: String, required: true, index: true },
  feature: { type: String, enum: AI_FEATURES, required: true },
  targetRole: { type: String },
  bestMatchingRoles: { type: [String], default: undefined },
  skillGaps: { type: [String], default: undefined },
  excludedRoles: { type: [String], default: undefined },
  focusSkill: { type: String },
  createdAt: { type: Date, default: () => new Date(), index: true },
});

export const AiUsage = model<AiUsageDocument>("AiUsage", aiUsageSchema);
