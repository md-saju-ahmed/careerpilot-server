import mongoose, { type QueryFilter, Document, Schema, Types } from "mongoose";

export interface UserReadModelDocument extends Document {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  createdAt?: Date;
}

const userReadSchema = new Schema<UserReadModelDocument>(
  {},
  { collection: "user", strict: false, timestamps: false },
);

export const UserReadModel =
  (mongoose.models.UserReadModel as mongoose.Model<UserReadModelDocument>) ||
  mongoose.model<UserReadModelDocument>("UserReadModel", userReadSchema);

/**
 * Creates a filter that matches either a better-auth user ID (`id`)
 * or a MongoDB document ID (`_id`).
 */
export function buildUserIdFilter(
  id: string,
): QueryFilter<UserReadModelDocument> {
  const clauses: QueryFilter<UserReadModelDocument>[] = [{ id }];
  if (Types.ObjectId.isValid(id)) {
    clauses.push({ _id: new Types.ObjectId(id) });
  }
  return { $or: clauses };
}

// better-auth collections used for user cleanup operations.
export interface SessionReadModelDocument extends Document {
  userId?: string;
}

const sessionReadSchema = new Schema<SessionReadModelDocument>(
  {},
  { collection: "session", strict: false, timestamps: false },
);

export const SessionReadModel =
  (mongoose.models
    .SessionReadModel as mongoose.Model<SessionReadModelDocument>) ||
  mongoose.model<SessionReadModelDocument>(
    "SessionReadModel",
    sessionReadSchema,
  );

export interface AccountReadModelDocument extends Document {
  userId?: string;
}

const accountReadSchema = new Schema<AccountReadModelDocument>(
  {},
  { collection: "account", strict: false, timestamps: false },
);

export const AccountReadModel =
  (mongoose.models
    .AccountReadModel as mongoose.Model<AccountReadModelDocument>) ||
  mongoose.model<AccountReadModelDocument>(
    "AccountReadModel",
    accountReadSchema,
  );
