import { ApiError } from "../../lib/ApiError.js";
import { Job } from "../jobs/job.model.js";
import {
  Category,
  DEFAULT_CATEGORIES,
  type CategoryDocument,
} from "./category.model.js";
import {
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "./category.validators.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Seeds default categories when the collection is empty.
 */
async function ensureSeeded(): Promise<void> {
  const count = await Category.countDocuments({});
  if (count > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((category, index) => ({
      name: category.name,
      slug: slugify(category.name),
      icon: category.icon,
      order: index,
    })),
  );
}

function serialize(category: CategoryDocument) {
  return category.toJSON() as unknown as {
    id: string;
    name: string;
    slug: string;
    icon: string;
    order: number;
    createdAt: string;
  };
}

export async function listCategories() {
  await ensureSeeded();
  const categories = await Category.find({}).sort({ order: 1, name: 1 });
  return categories.map(serialize);
}

/**
 * Returns categories with their associated job counts.
 * Categories with no jobs are included with a count of zero.
 */
export async function getCategoryBreakdown() {
  await ensureSeeded();

  const [categories, counts] = await Promise.all([
    Category.find({}).sort({ order: 1, name: 1 }),
    Job.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  return categories.map((category) => ({
    ...serialize(category),
    count: countMap.get(category.name) ?? 0,
  }));
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await Category.findOne({ name: input.name });
  if (existing) {
    throw new ApiError(409, `A category named "${input.name}" already exists`);
  }

  const maxOrder = await Category.findOne({})
    .sort({ order: -1 })
    .select("order");

  const category = await Category.create({
    name: input.name,
    slug: slugify(input.name),
    icon: input.icon,
    order: input.order ?? (maxOrder ? maxOrder.order + 1 : 0),
  });

  return serialize(category);
}

export async function updateCategory(id: string, patch: UpdateCategoryInput) {
  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (patch.name && patch.name !== category.name) {
    const existing = await Category.findOne({
      name: patch.name,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(
        409,
        `A category named "${patch.name}" already exists`,
      );
    }

    // Propagate the category name change to all related jobs.
    await Job.updateMany(
      { category: category.name },
      { $set: { category: patch.name } },
    );

    category.name = patch.name;
    category.slug = slugify(patch.name);
  }

  if (patch.icon !== undefined) category.icon = patch.icon;
  if (patch.order !== undefined) category.order = patch.order;

  await category.save();
  return serialize(category);
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const jobsUsingCategory = await Job.countDocuments({
    category: category.name,
  });
  if (jobsUsingCategory > 0) {
    throw new ApiError(
      409,
      `Can't delete "${category.name}" — ${jobsUsingCategory} job${
        jobsUsingCategory === 1 ? "" : "s"
      } still use it. Reassign or remove those jobs first.`,
    );
  }

  await category.deleteOne();
}

/**
 * Validates that a category exists before it is referenced.
 */
export async function categoryExists(name: string): Promise<boolean> {
  await ensureSeeded();
  const category = await Category.findOne({ name });
  return !!category;
}
