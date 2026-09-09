import { type QueryFilter, Types } from "mongoose";
import { ApiError } from "../../lib/ApiError.js";
import { revokeSessionsForUser } from "../../lib/session.js";
import {
  requireNonEmptyFilter,
  requireObjectIdFilter,
} from "../../lib/mongoFilterGuard.js";
import { Job, SavedJob, Application } from "../jobs/job.model.js";
import { Profile } from "../profile/profile.model.js";
import { RecruiterProfile } from "../recruiter/recruiter.model.js";
import { Settings, SETTINGS_KEY } from "./settings.model.js";
import {
  UserReadModel,
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
    recruiterStatus: (doc.recruiterStatus as string) ?? undefined,
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
      .select("name email role status recruiterStatus createdAt")
      .skip(skip)
      .limit(query.limit)
      .lean(),
    UserReadModel.countDocuments(filter),
  ]);

  return {
    users: users.map((user) =>
      serializeUser(user as unknown as Record<string, unknown>),
    ),
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
    { returnDocument: "after" },
  )
    .select("id name email role status createdAt")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Remove active sessions so the suspension takes effect immediately.
  if (status === "suspended") {
    const doc = user as unknown as Record<string, unknown>;
    const objectId = doc._id as Types.ObjectId;
    await revokeSessionsForUser(objectId);
  }

  return serializeUser(user as unknown as Record<string, unknown>);
}

/**
 * Deletes a user and cleans up associated authentication records and app-owned data.
 */
export async function deleteUser(id: string) {
  const user = await UserReadModel.findOne(buildUserIdFilter(id))
    .select("id role")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const doc = user as unknown as Record<string, unknown>;

  if (doc.role === "admin") {
    throw new ApiError(400, "Admin accounts can't be deleted from here");
  }

  const objectId = doc._id as Types.ObjectId;
  const resolvedId = objectId.toString();

  await UserReadModel.deleteOne({ _id: objectId });

  const accountFilter = { userId: objectId };
  const recruiterProfileFilter = { userId: resolvedId };
  const profileFilter = { userId: resolvedId };
  const savedJobFilter = { userId: resolvedId };
  const applicationFilter = { userId: resolvedId };

  for (const filter of [
    accountFilter,
    recruiterProfileFilter,
    profileFilter,
    savedJobFilter,
    applicationFilter,
  ]) {
    requireNonEmptyFilter(filter);
  }

  requireObjectIdFilter("accountFilter.userId", accountFilter.userId);

  const [accountMatching, accountTotal] = await Promise.all([
    AccountReadModel.collection.countDocuments(accountFilter),
    AccountReadModel.collection.countDocuments({}),
  ]);
  if (accountTotal > 3 && accountMatching === accountTotal) {
    throw new Error(
      `deleteUser: account filter for userId=${resolvedId} matches all ` +
        `${accountTotal} documents in \`account\`. Refusing to run a ` +
        `delete that looks unscoped.`,
    );
  }

  await Promise.all([
    revokeSessionsForUser(objectId),
    AccountReadModel.collection.deleteMany(accountFilter),
    RecruiterProfile.deleteOne(recruiterProfileFilter),
    Profile.deleteOne(profileFilter),
    SavedJob.deleteMany(savedJobFilter),
    Application.deleteMany(applicationFilter),
    Job.updateMany(
      { createdBy: resolvedId, status: "published" },
      { $set: { status: "closed" } },
    ),
  ]);
}

export interface ListRecruitersQuery {
  recruiterStatus?: string;
  page: number;
  limit: number;
}

function serializeRecruiter(doc: Record<string, unknown>) {
  return {
    id: doc.id ?? (doc._id as Types.ObjectId).toString(),
    name: doc.name ?? "",
    email: doc.email ?? "",
    role: doc.role ?? "recruiter",
    status: doc.status ?? "active",
    recruiterStatus: doc.recruiterStatus ?? "pending",
    createdAt: doc.createdAt ?? null,
  };
}

export async function listRecruiters(query: ListRecruitersQuery) {
  const filter: QueryFilter<UserReadModelDocument> = { role: "recruiter" };

  if (query.recruiterStatus) {
    filter.recruiterStatus = query.recruiterStatus;
  }

  const skip = (query.page - 1) * query.limit;

  const [recruiters, total] = await Promise.all([
    UserReadModel.find(filter)
      .select("name email role status recruiterStatus createdAt")
      .skip(skip)
      .limit(query.limit)
      .lean(),
    UserReadModel.countDocuments(filter),
  ]);

  return {
    recruiters: recruiters.map((r) =>
      serializeRecruiter(r as unknown as Record<string, unknown>),
    ),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function updateRecruiterStatus(
  id: string,
  recruiterStatus: "approved" | "rejected" | "suspended" | "pending",
) {
  const user = await UserReadModel.findOneAndUpdate(
    { ...buildUserIdFilter(id), role: "recruiter" },
    { $set: { recruiterStatus } },
    { returnDocument: "after" },
  )
    .select("id name email role status recruiterStatus createdAt")
    .lean();

  if (!user) {
    throw new ApiError(404, "Recruiter not found");
  }

  const doc = user as unknown as Record<string, unknown>;
  const objectId = doc._id as Types.ObjectId;
  const resolvedId = objectId.toString();

  if (recruiterStatus === "suspended") {
    await revokeSessionsForUser(objectId);

    await Job.updateMany(
      { createdBy: resolvedId, status: "published" },
      { $set: { status: "closed" } },
    );
  }

  return serializeRecruiter(doc);
}

export async function getSettings() {
  const settings = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
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
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  return settings.toJSON();
}
