import { Document, Schema, Types, model } from "mongoose";

export interface RecruiterProfileDocument extends Document {
  userId: string;
  companyName: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  logoUrl?: string;
  description?: string;
  verificationNote: string;
}

const recruiterProfileSchema = new Schema<RecruiterProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, required: true, trim: true },
    companyWebsite: { type: String, trim: true },
    companySize: { type: String, trim: true },
    industry: { type: String, trim: true },
    logoUrl: { type: String },
    description: { type: String, trim: true, maxlength: 2000 },
    verificationNote: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  {
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as Types.ObjectId).toString();
        delete ret._id;
        delete ret.userId;
        return ret;
      },
    },
  },
);

export const RecruiterProfile = model<RecruiterProfileDocument>(
  "RecruiterProfile",
  recruiterProfileSchema,
);
