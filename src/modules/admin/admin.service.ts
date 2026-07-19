import { type QueryFilter, Types } from "mongoose";
import { ApiError } from "../../lib/ApiError.js";
import { Settings, SETTINGS_KEY } from "./settings.model.js";
import {
  UserReadModel,
  SessionReadModel,
  AccountReadModel,
  buildUserIdFilter,
  type UserReadModelDocument,
} from "./user.readmodel.js";
import { type UpdateSettingsInput } from "./admin.validators.js";

export interface ListUsersQuery {
  search?: string;
  page: number;
  limit: number;
}

function serializeUser(doc: Record<string, unknown>) {
  return {
    id: doc.id ?? (doc._id as Types.ObjectId).toString(),
    name: doc.name ?? "",
    email: doc.email ?? "",
    role: doc.role ?? "user",
    status: doc.status ?? "active",
    createdAt: doc.createdAt ?? null,
  };
}

export async function listUsers(query: ListUsersQuery) {
  const filter: QueryFilter<UserReadModelDocument> = {};

  if (query.search) {
    const regex = new RegExp(
      query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    UserReadModel.find(filter)
      .select("name email role status createdAt")
      .skip(skip)
      .limit(query.limit)
      .lean(),
    UserReadModel.countDocuments(filter),
  ]);

  return {
    users: users.map((user) => serializeUser(user as unknown as Record<string, unknown>)),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function updateUserStatus(
  id: string,
  status: "active" | "suspended",
) {
  const user = await UserReadModel.findOneAndUpdate(
    buildUserIdFilter(id),
    { $set: { status } },
    { new: true },
  )
    .select("id name email role status createdAt")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Remove active sessions so the suspension takes effect immediately.
  if (status === "suspended") {
    const doc = user as unknown as Record<string, unknown>;
    const resolvedId =
      (doc.id as string) ?? (doc._id as Types.ObjectId).toString();
    await SessionReadModel.deleteMany({ userId: resolvedId });
  }

  return serializeUser(user as unknown as Record<string, unknown>);
}

/**
 * Deletes a user and cleans up associated authentication records.
 */
export async function deleteUser(id: string) {
  const user = await UserReadModel.findOne(buildUserIdFilter(id))
    .select("id")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const doc = user as unknown as Record<string, unknown>;
  const resolvedId =
    (doc.id as string) ?? (doc._id as Types.ObjectId).toString();

  await Promise.all([
    UserReadModel.deleteOne({ _id: doc._id as Types.ObjectId }),
    SessionReadModel.deleteMany({ userId: resolvedId }),
    AccountReadModel.deleteMany({ userId: resolvedId }),
  ]);
}

export async function getSettings() {
  const settings = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return settings.toJSON();
}

export async function getPublicSettings() {
  const { siteName, supportEmail, maintenanceMode, allowRegistrations } =
    await getSettings();

  return { siteName, supportEmail, maintenanceMode, allowRegistrations };
}

export async function updateSettings(patch: UpdateSettingsInput) {
  const settings = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: patch, $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return settings.toJSON();
}
