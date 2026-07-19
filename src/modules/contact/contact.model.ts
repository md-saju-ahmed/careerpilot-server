import { Document, Schema, Types, model } from "mongoose";

export interface ContactDocument extends Document {
  name: string;
  email: string;
  message: string;
  resolved: boolean;
  createdAt: Date;
}

const contactSchema = new Schema<ContactDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  {
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as Types.ObjectId).toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

export const Contact = model<ContactDocument>("Contact", contactSchema);
