import { AiUsage } from "../ai/aiUsage.model.js";
import { UserReadModel } from "../admin/user.readmodel.js";
import { Contact } from "../contact/contact.model.js";
import * as categoryService from "../categories/category.service.js";
import { Application, Job, SavedJob, toJobJSON } from "../jobs/job.model.js";
import { Profile } from "../profile/profile.model.js";

export type StatIcon = "briefcase" | "bookmark" | "sparkles" | "user";

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  icon: StatIcon;
}

export interface CategoryBreakdownEntry {
  category: string;
  count: number;
}

export interface MonthlyTrendEntry {
  month: string;
  jobs: number;
}

export interface RecentJobEntry {
  id: string;
  slug: string;
  title: string;
  company: string;
  category: string;
  postedAt: string;
}

export interface DashboardSummary {
  stats: DashboardStat[];
  categoryBreakdown: CategoryBreakdownEntry[];
  monthlyTrend: MonthlyTrendEntry[];
  recentJobs: RecentJobEntry[];
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

async function computeProfileCompleteness(userId: string): Promise<number> {
  const profile = await Profile.findOne({ userId });
  if (!profile) return 0;

  const checks = [
    Boolean(profile.name),
    Boolean(profile.phone),
    Boolean(profile.role),
    Boolean(profile.address),
    profile.skills.length > 0,
    profile.education.length > 0,
    profile.experience.length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

async function getUserStats(userId: string): Promise<DashboardStat[]> {
  const now = new Date();

  const [appliedCount, savedCount, aiGenerationsThisMonth, completeness] =
    await Promise.all([
      Application.countDocuments({ userId }),
      SavedJob.countDocuments({ userId }),
      AiUsage.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth(now) },
      }),
      computeProfileCompleteness(userId),
    ]);

  return [
    {
      id: "total-applied",
      label: "Total applied",
      value: String(appliedCount),
      icon: "briefcase",
    },
    {
      id: "saved-jobs",
      label: "Saved jobs",
      value: String(savedCount),
      icon: "bookmark",
    },
    {
      id: "ai-generations",
      label: "AI generations this month",
      value: String(aiGenerationsThisMonth),
      icon: "sparkles",
    },
    {
      id: "profile-completeness",
      label: "Profile completeness",
      value: `${completeness}%`,
      icon: "user",
    },
  ];
}

async function getRecruiterStats(userId: string): Promise<DashboardStat[]> {
  const [publishedJobs, draftJobs, closedJobs, applicationsReceived] =
    await Promise.all([
      Job.countDocuments({ createdBy: userId, status: "published" }),
      Job.countDocuments({ createdBy: userId, status: "draft" }),
      Job.countDocuments({ createdBy: userId, status: "closed" }),
      Application.countDocuments({
        jobId: { $in: await Job.distinct("_id", { createdBy: userId }) },
      }),
    ]);

  return [
    {
      id: "published-jobs",
      label: "Published jobs",
      value: String(publishedJobs),
      icon: "briefcase",
    },
    {
      id: "draft-jobs",
      label: "Draft jobs",
      value: String(draftJobs),
      icon: "bookmark",
    },
    {
      id: "applications-received",
      label: "Applications received",
      value: String(applicationsReceived),
      icon: "sparkles",
    },
    {
      id: "closed-jobs",
      label: "Closed jobs",
      value: String(closedJobs),
      icon: "user",
    },
  ];
}

async function getAdminStats(): Promise<DashboardStat[]> {
  const now = new Date();

  const [totalJobs, totalUsers, totalContactSubmissions, jobsThisWeek] =
    await Promise.all([
      Job.countDocuments({}),
      UserReadModel.countDocuments({}),
      Contact.countDocuments({}),
      Job.countDocuments({ postedAt: { $gte: startOfWeek(now) } }),
    ]);

  return [
    {
      id: "total-jobs",
      label: "Total jobs",
      value: String(totalJobs),
      icon: "briefcase",
    },
    {
      id: "total-users",
      label: "Total users",
      value: String(totalUsers),
      icon: "user",
    },
    {
      id: "contact-submissions",
      label: "Contact submissions",
      value: String(totalContactSubmissions),
      icon: "sparkles",
    },
    {
      id: "jobs-this-week",
      label: "Jobs posted this week",
      value: String(jobsThisWeek),
      icon: "bookmark",
    },
  ];
}

async function getMonthlyTrend(): Promise<MonthlyTrendEntry[]> {
  const now = new Date();
  const rangeStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 5, 1),
  );

  const results = await Job.aggregate<{
    _id: { year: number; month: number };
    count: number;
  }>([
    { $match: { postedAt: { $gte: rangeStart } } },
    {
      $group: {
        _id: { year: { $year: "$postedAt" }, month: { $month: "$postedAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(
    results.map((r) => [`${r._id.year}-${r._id.month}`, r.count]),
  );

  const trend: MonthlyTrendEntry[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

    trend.push({
      month: MONTH_LABELS[d.getMonth()]!,
      jobs: counts.get(key) ?? 0,
    });
  }

  return trend;
}

async function getRecentJobs(): Promise<RecentJobEntry[]> {
  const jobs = await Job.find({})
    .sort({ postedAt: -1 })
    .limit(5)
    .select("title company category slug postedAt");

  return jobs.map((job) => {
    const json = toJobJSON(job);
    return {
      id: json.id,
      slug: json.slug,
      title: json.title,
      company: json.company,
      category: json.category,
      postedAt: String(json.postedAt),
    };
  });
}

export interface PublicStats {
  jobs: number;
  users: number;
  applications: number;
  companies: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const [jobs, users, applications, companies] = await Promise.all([
    Job.countDocuments({}),
    UserReadModel.countDocuments({}),
    Application.countDocuments({}),
    Job.distinct("company"),
  ]);

  return { jobs, users, applications, companies: companies.length };
}

export async function getSummary(
  userId: string,
  role: string,
): Promise<DashboardSummary> {
  const [stats, categories, monthlyTrend, recentJobs] = await Promise.all([
    role === "admin"
      ? getAdminStats()
      : role === "recruiter"
        ? getRecruiterStats(userId)
        : getUserStats(userId),
    categoryService.getCategoryBreakdown(),
    getMonthlyTrend(),
    getRecentJobs(),
  ]);

  const categoryBreakdown: CategoryBreakdownEntry[] = categories.map(
    (category) => ({
      category: category.name as string,
      count: category.count,
    }),
  );

  return { stats, categoryBreakdown, monthlyTrend, recentJobs };
}
