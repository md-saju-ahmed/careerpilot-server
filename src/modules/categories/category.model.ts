import { Document, Schema, Types, model } from "mongoose";

/**
 * Supported icon keys that can be assigned to categories.
 */
export const CATEGORY_ICONS = [
  "code",
  "server",
  "brain",
  "cloud",
  "database",
  "palette",
  "shield",
  "network",
  "briefcase",
  "rocket",
  "globe",
  "layers",
  "sparkles",
  "wrench",
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

/**
 * Default categories used when seeding the collection.
 */
export const DEFAULT_CATEGORIES: { name: string; icon: CategoryIcon }[] = [
  { name: "Frontend", icon: "code" },
  { name: "Backend", icon: "server" },
  { name: "AI", icon: "brain" },
  { name: "DevOps", icon: "cloud" },
  { name: "Data Science", icon: "database" },
  { name: "UI UX", icon: "palette" },
  { name: "Cyber Security", icon: "shield" },
  { name: "Cloud", icon: "network" },
];

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  icon: CategoryIcon;
  order: number;
  createdAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    icon: { type: String, enum: CATEGORY_ICONS, default: "briefcase" },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: () => new Date() },
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

export const Category = model<CategoryDocument>("Category", categorySchema);
