import { Types } from "mongoose";
import { ApiError } from "../../lib/ApiError.js";
import {
  Application,
  Job,
  type ApplicationDocument,
  type JobDocument,
} from "../jobs/job.model.js";
import { UserReadModel, buildUserIdFilter } from "../admin/user.readmodel.js";
import { Profile } from "../profile/profile.model.js";
import type { UpdateApplicationStatusInput } from "./application.validators.js";

export async function getApplicationJobOwnerId(
  applicationId: string,
): Promise<string | null> {
  if (!Types.ObjectId.isValid(applicationId)) return null;

  const application = await Application.findById(applicationId)
    .select("jobId")
    .lean();

  if (!application) return null;

  const job = await Job.findById(
    (application as unknown as Record<string, unknown>).jobId,
  )
    .select("createdBy")
    .lean();

  if (!job) return null;

  return (job as unknown as JobDocument).createdBy;
}

export async function listApplicants(
  jobId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find({ jobId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments({ jobId }),
  ]);

  const enriched = await Promise.all(
    applications.map(async (app) => {
      const doc = app as unknown as Record<string, unknown>;
      const userId = doc.userId as string;

      const [user, profile] = await Promise.all([
        UserReadModel.findOne(buildUserIdFilter(userId))
          .select("name email")
          .lean(),
        Profile.findOne({ userId }).select("role skills experience").lean(),
      ]);

      const userDoc = user as unknown as Record<string, unknown> | null;
      const profileDoc = profile as unknown as Record<string, unknown> | null;

      const experienceArr = profileDoc?.experience as
        | Array<Record<string, unknown>>
        | undefined;
      const latestExp = experienceArr?.[experienceArr.length - 1];
      const latestExperience = latestExp
        ? {
            title: (latestExp.title as string) ?? "",
            company: (latestExp.company as string) ?? "",
          }
        : undefined;

      const rawSkills = profileDoc?.skills as string[] | undefined;
      const skills = rawSkills?.slice(0, 6) ?? [];

      return {
        id: (doc._id as Types.ObjectId).toString(),
        jobId: (doc.jobId as Types.ObjectId).toString(),
        userId,
        applicantName: (userDoc?.name as string) ?? "",
        applicantEmail: (userDoc?.email as string) ?? "",
        headline: (profileDoc?.role as string) ?? "",
        skills,
        latestExperience,
        status: (doc.status as string) ?? "applied",
        statusUpdatedAt: doc.statusUpdatedAt ?? doc.createdAt,
        createdAt: doc.createdAt,
      };
    }),
  );

  return {
    applications: enriched,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function updateApplicationStatus(
  applicationId: string,
  input: UpdateApplicationStatusInput,
) {
  const application = await Application.findByIdAndUpdate(
    applicationId,
    { $set: { status: input.status, statusUpdatedAt: new Date() } },
    { new: true },
  ).lean();

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  const doc = application as unknown as Record<string, unknown>;

  // TODO Task 26: create a Notification for the applicant here.

  return {
    id: (doc._id as Types.ObjectId).toString(),
    status: doc.status,
    statusUpdatedAt: doc.statusUpdatedAt,
  };
}

export async function listMyApplications(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find({ userId })
      .sort({ statusUpdatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ jobId: JobDocument }>("jobId", "title company slug status")
      .lean(),
    Application.countDocuments({ userId }),
  ]);

  const results = applications.map((app) => {
    const doc = app as unknown as Record<string, unknown>;
    const job = doc.jobId as unknown as Record<string, unknown> | null;

    return {
      id: (doc._id as Types.ObjectId).toString(),
      status: (doc.status as string) ?? "applied",
      statusUpdatedAt: doc.statusUpdatedAt ?? doc.createdAt,
      createdAt: doc.createdAt,
      job: job
        ? {
            id: (job._id as Types.ObjectId).toString(),
            title: (job.title as string) ?? "",
            company: (job.company as string) ?? "",
            slug: (job.slug as string) ?? "",
            status: (job.status as string) ?? "",
          }
        : null,
    };
  });

  return {
    applications: results,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
