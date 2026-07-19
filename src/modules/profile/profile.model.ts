import { Document, Schema, Types, model } from "mongoose";

function stripId(
  _doc: unknown,
  ret: Record<string, unknown>,
): Record<string, unknown> {
  ret.id = (ret._id as Types.ObjectId).toString();
  delete ret._id;
  return ret;
}

export interface EducationEntry {
  _id: Types.ObjectId;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

const educationSchema = new Schema<EducationEntry>(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    startYear: { type: String, required: true },
    endYear: { type: String, required: true },
  },
  { toJSON: { transform: stripId } },
);

export interface ExperienceEntry {
  _id: Types.ObjectId;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

const experienceSchema = new Schema<ExperienceEntry>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { toJSON: { transform: stripId } },
);

export interface ProfileDocument extends Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  gender?: string;
  avatarUrl?: string;
  skills: string[];
  education: Types.DocumentArray<EducationEntry>;
  experience: Types.DocumentArray<ExperienceEntry>;
}

const profileSchema = new Schema<ProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    role: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: undefined,
    },
    avatarUrl: { type: String },
    skills: { type: [String], default: [] },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
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

export const Profile = model<ProfileDocument>("Profile", profileSchema);
