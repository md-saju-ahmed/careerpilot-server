import { type QueryFilter, Types } from "mongoose";
import { ApiError } from "../../lib/ApiError.js";
import { categoryExists } from "../categories/category.service.js";
import { type AddJobInput } from "./job.validators.js";
import {
  Application,
  DEFAULT_BENEFITS,
  Job,
  type EmploymentType,
  type JobDocument,
  SavedJob,
  toJobJSON,
} from "./job.model.js";

export interface ListJobsQuery {
  query?: string;
  category?: string[];
  location?: string;
  experience?: string;
  employmentType?: string;
  salaryMin?: number;
  skills?: string[];
  sort: "newest" | "salary" | "title";
  page: number;
  limit: number;
  mine?: boolean;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  title: string,
  company: string,
): Promise<string> {
  const base = slugify(`${title}-${company}`) || "job";
  let slug = base;
  let suffix = 2;

  // eslint-disable-next-line no-await-in-loop
  while (await Job.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function buildFilter(
  query: ListJobsQuery,
  userId?: string,
): QueryFilter<JobDocument> {
  const filter: QueryFilter<JobDocument> = {};

  if (query.mine && userId) {
    filter.createdBy = userId;
  }

  if (query.query) {
    const regex = new RegExp(escapeRegex(query.query), "i");
    filter.$or = [{ title: regex }, { company: regex }, { skills: regex }];
  }

  if (query.category?.length) {
    filter.category = { $in: query.category };
  }

  if (query.location) {
    filter.location = new RegExp(escapeRegex(query.location), "i");
  }

  if (query.experience) {
    filter.experience = query.experience;
  }

  if (query.employmentType) {
    filter.employmentType = query.employmentType as EmploymentType;
  }

  if (query.salaryMin !== undefined) {
    filter.$and = [
      {
        $or: [
          { salaryMax: { $gte: query.salaryMin } },
          {
            salaryMax: { $exists: false },
            salaryMin: { $gte: query.salaryMin },
          },
        ],
      },
    ];
  }

  if (query.skills?.length) {
    filter.skills = {
      $in: query.skills.map((skill) => new RegExp(escapeRegex(skill), "i")),
    };
  }

  return filter;
}

function buildSort(sort: ListJobsQuery["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "salary":
      return { salaryMax: -1, salaryMin: -1 };
    case "title":
      return { title: 1 };
    case "newest":
    default:
      return { postedAt: -1 };
  }
}

/**
 * Returns the IDs of jobs saved by the user.
 * Anonymous users receive an empty set.
 */
async function getSavedJobIdSet(
  userId: string | undefined,
  jobIds: Types.ObjectId[],
): Promise<Set<string>> {
  if (!userId || !jobIds.length) return new Set();

  const saves = await SavedJob.find({ userId, jobId: { $in: jobIds } })
    .select("jobId")
    .lean();

  return new Set(saves.map((save) => save.jobId.toString()));
}

/**
 * Returns the IDs of jobs the user has applied for.
 */
async function getAppliedJobIdSet(
  userId: string | undefined,
  jobIds: Types.ObjectId[],
): Promise<Set<string>> {
  if (!userId || !jobIds.length) return new Set();

  const applications = await Application.find({
    userId,
    jobId: { $in: jobIds },
  })
    .select("jobId")
    .lean();

  return new Set(
    applications.map((application) => application.jobId.toString()),
  );
}

export async function listJobs(query: ListJobsQuery, userId?: string) {
  const filter = buildFilter(query, userId);
  const sort = buildSort(query.sort);
  const skip = (query.page - 1) * query.limit;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort(sort).skip(skip).limit(query.limit),
    Job.countDocuments(filter),
  ]);

  const jobIds = jobs.map((job) => job._id as Types.ObjectId);
  const [savedIds, appliedIds] = await Promise.all([
    getSavedJobIdSet(userId, jobIds),
    getAppliedJobIdSet(userId, jobIds),
  ]);

  return {
    jobs: jobs.map((job) => {
      const json = toJobJSON(job);
      return {
        ...json,
        saved: savedIds.has(json.id),
        applied: appliedIds.has(json.id),
      };
    }),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getJobBySlug(slug: string, userId?: string) {
  const job = await Job.findOne({ slug });

  if (!job) {
    throw new ApiError(404, `No job found with slug "${slug}"`);
  }

  const relatedJobs = await Job.find({
    category: job.category,
    _id: { $ne: job._id },
  })
    .sort({ postedAt: -1 })
    .limit(4);

  const allIds = [
    job._id as Types.ObjectId,
    ...relatedJobs.map((related) => related._id as Types.ObjectId),
  ];

  const [savedIds, appliedIds] = await Promise.all([
    getSavedJobIdSet(userId, allIds),
    getAppliedJobIdSet(userId, allIds),
  ]);

  const json = toJobJSON(job);

  return {
    ...json,
    saved: savedIds.has(json.id),
    applied: appliedIds.has(json.id),
    relatedJobs: relatedJobs.map((related) => {
      const relatedJson = toJobJSON(related);
      return {
        ...relatedJson,
        saved: savedIds.has(relatedJson.id),
        applied: appliedIds.has(relatedJson.id),
      };
    }),
  };
}

export async function createJob(input: AddJobInput, userId: string) {
  const validCategory = await categoryExists(input.category);
  if (!validCategory) {
    throw new ApiError(400, `Unknown category "${input.category}"`);
  }

  const slug = await generateUniqueSlug(input.title, input.company);

  const payload = {
    ...input,
    slug,
    benefits: input.benefits?.length ? input.benefits : DEFAULT_BENEFITS,
    createdBy: userId,
  } as unknown as Partial<JobDocument>;

  if (input.deadline) {
    payload.deadline = new Date(input.deadline);
  }

  const job = await Job.create(payload);

  return toJobJSON(job);
}

export async function getJobOwnerId(jobId: string): Promise<string | null> {
  if (!Types.ObjectId.isValid(jobId)) return null;
  const job = await Job.findById(jobId).select("createdBy");
  return job ? job.createdBy : null;
}

export async function deleteJob(jobId: string): Promise<void> {
  const job = await Job.findByIdAndDelete(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  await SavedJob.deleteMany({ jobId: job._id });
}

export async function toggleSaveJob(
  jobId: string,
  userId: string,
): Promise<{ saved: boolean }> {
  const job = await Job.exists({ _id: jobId });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const existing = await SavedJob.findOne({ userId, jobId });

  if (existing) {
    await existing.deleteOne();
    return { saved: false };
  }

  await SavedJob.create({ userId, jobId });
  return { saved: true };
}

/**
 * Records a job application for the user.
 * Prevents duplicate applications for the same job.
 */
export async function applyToJob(
  jobId: string,
  userId: string,
): Promise<{ applied: true }> {
  const job = await Job.exists({ _id: jobId });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const existing = await Application.exists({ userId, jobId });

  if (existing) {
    throw new ApiError(409, "You have already applied to this job");
  }

  await Application.create({ userId, jobId });
  return { applied: true };
}

/**
 * Counts saved jobs that still reference an existing job document.
 * This prevents orphaned saved records from affecting totals.
 */
async function countValidSavedJobs(userId: string): Promise<number> {
  const result = await SavedJob.aggregate<{ count: number }>([
    { $match: { userId } },
    {
      $lookup: {
        from: Job.collection.name,
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $match: { job: { $ne: [] } } },
    { $count: "count" },
  ]);

  return result[0]?.count ?? 0;
}

export async function getSavedJobs(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [saves, total] = await Promise.all([
    SavedJob.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ jobId: JobDocument }>("jobId"),
    countValidSavedJobs(userId),
  ]);

  // Exclude saved records whose job no longer exists.
  const validSaves = saves.filter((save) => save.jobId);

  const jobIds = validSaves.map((save) => save.jobId._id as Types.ObjectId);
  const appliedIds = await getAppliedJobIdSet(userId, jobIds);

  const jobs = validSaves.map((save) => {
    const json = toJobJSON(save.jobId);
    return {
      ...json,
      saved: true,
      applied: appliedIds.has(json.id),
    };
  });

  return {
    jobs,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
