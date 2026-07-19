import { Document, Schema, Types, model } from "mongoose";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface TestimonialDocument extends Document {
  userId: string;
  name: string;
  role: string;
  rating: number;
  review: string;
  status: TestimonialStatus;
  createdAt: Date;
}

const testimonialSchema = new Schema<TestimonialDocument>(
  {
    // Better Auth user ID stored as a string, not a MongoDB ObjectId.
    // Used internally and removed from API responses.
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    createdAt: { type: Date, default: () => new Date(), index: true },
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

export const Testimonial = model<TestimonialDocument>(
  "Testimonial",
  testimonialSchema,
);
