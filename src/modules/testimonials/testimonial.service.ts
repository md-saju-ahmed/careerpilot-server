import { ApiError } from "../../lib/ApiError.js";
import { Profile } from "../profile/profile.model.js";
import { Testimonial, type TestimonialStatus } from "./testimonial.model.js";
import { type SubmitTestimonialInput } from "./testimonial.validators.js";

/**
 * Testimonials display the user's name, role, and avatar, but these values
 * are never accepted from the submission payload. Instead, they are derived
 * from the user's Profile to prevent impersonation and keep testimonial
 * identity consistent across the platform. If no profile information
 * exists, generic fallback values are used.
 */
async function resolveDisplayIdentity(userId: string, fallbackName?: string) {
  const profile = await Profile.findOne({ userId })
    .select("name role avatarUrl")
    .lean();

  const name =
    profile?.name?.trim() || fallbackName?.trim() || "CareerPilot user";
  const role = profile?.role?.trim() || "CareerPilot user";
  const avatarUrl = profile?.avatarUrl?.trim() || undefined;

  return { name, role, avatarUrl };
}

export async function submitTestimonial(
  user: { id: string; name?: string },
  input: SubmitTestimonialInput,
) {
  const { name, role, avatarUrl } = await resolveDisplayIdentity(
    user.id,
    user.name,
  );

  const testimonial = await Testimonial.create({
    ...input,
    name,
    role,
    ...(avatarUrl ? { avatarUrl } : {}),
    userId: user.id,
    status: "pending",
  });
  return testimonial.toJSON();
}

export interface ListApprovedQuery {
  limit: number;
}

export async function listApproved(query: ListApprovedQuery) {
  const testimonials = await Testimonial.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(query.limit);

  return testimonials.map((testimonial) => testimonial.toJSON());
}

export interface ListTestimonialsQuery {
  status?: TestimonialStatus;
  page: number;
  limit: number;
}

export async function adminList(query: ListTestimonialsQuery) {
  const filter = query.status ? { status: query.status } : {};
  const skip = (query.page - 1) * query.limit;

  const [testimonials, total] = await Promise.all([
    Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Testimonial.countDocuments(filter),
  ]);

  return {
    testimonials: testimonials.map((testimonial) => testimonial.toJSON()),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function updateStatus(id: string, status: TestimonialStatus) {
  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  testimonial.status = status;
  await testimonial.save();
  return testimonial.toJSON();
}
