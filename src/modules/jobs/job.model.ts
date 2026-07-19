import { Document, Schema, Types, model } from "mongoose";

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Default benefits applied when no custom benefits are provided. */
export const DEFAULT_BENEFITS = [
  "Competitive salary",
  "Remote-friendly",
  "Health insurance",
  "Learning budget",
  "Flexible PTO",
  "Home office stipend",
];

export interface JobDocument extends Document {
  slug: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;

  /**
   * Stores the category name.
   * Categories are managed dynamically by admins, so validation is handled
   * in the service layer instead of a fixed enum.
   */
  category: string;

  employmentType: EmploymentType;
  experience: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  shortDescription: string;
  description: string;
  benefits: string[];
  deadline?: Date;
  postedAt: Date;
  createdBy: string;
}

const jobSchema = new Schema<JobDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    companyLogo: { type: String },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    experience: { type: String, required: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    skills: { type: [String], default: [] },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: [String], default: DEFAULT_BENEFITS },
    deadline: { type: Date },
    postedAt: { type: Date, default: () => new Date(), index: true },
    createdBy: { type: String, required: true, index: true },
  },
  {
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        // Convert MongoDB _id to a client-friendly id field
        ret.id = (ret._id as Types.ObjectId).toString();

        delete ret._id;

        // Return date fields as ISO strings
        if (ret.deadline)
          ret.deadline = new Date(ret.deadline as Date).toISOString();

        ret.postedAt = new Date(ret.postedAt as Date).toISOString();

        return ret;
      },
    },
  },
);

export const Job = model<JobDocument>("Job", jobSchema);

/**
 * Shape of a Job document after `.toJSON()`, matching the schema's
 * `toJSON.transform`: `_id` becomes `id` and date fields become ISO strings.
 */
export interface JobJSON {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  category: string;
  employmentType: EmploymentType;
  experience: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  shortDescription: string;
  description: string;
  benefits: string[];
  deadline?: string;
  postedAt: string;
  createdBy: string;
}

/** Serializes a Job document into its public JSON shape. */
export function toJobJSON(doc: JobDocument): JobJSON {
  return doc.toJSON() as unknown as JobJSON;
}

/**
 * Stores jobs saved by a user.
 * Kept separate from the Job collection so multiple users can save
 * the same job without modifying the job document itself.
 */
export interface SavedJobDocument extends Document {
  userId: string;
  jobId: Types.ObjectId;
  createdAt: Date;
}

const savedJobSchema = new Schema<SavedJobDocument>({
  userId: { type: String, required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  createdAt: { type: Date, default: () => new Date() },
});

// Prevent duplicate saves for the same user and job
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const SavedJob = model<SavedJobDocument>("SavedJob", savedJobSchema);

/**
 * Stores job applications submitted by users.
 * Kept separate from the Job collection so application data remains
 * user-specific and does not modify the shared job document.
 */
export interface ApplicationDocument extends Document {
  userId: string;
  jobId: Types.ObjectId;
  createdAt: Date;
}

const applicationSchema = new Schema<ApplicationDocument>({
  userId: { type: String, required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  createdAt: { type: Date, default: () => new Date() },
});

// Prevent duplicate applications for the same user and job
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const Application = model<ApplicationDocument>(
  "Application",
  applicationSchema,
);
