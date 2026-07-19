import { ApiError } from "../../lib/ApiError.js";
import {
  type EducationInput,
  type ExperienceInput,
  type PersonalInfoInput,
} from "./profile.validators.js";
import { Profile } from "./profile.model.js";

interface SeedClaims {
  email: string;
  name?: string;
}

export async function getOrCreateProfile(userId: string, claims: SeedClaims) {
  let profile = await Profile.findOne({ userId });

  if (!profile) {
    profile = await Profile.create({
      userId,
      name: claims.name ?? "",
      email: claims.email,
    });
  }

  return profile.toJSON();
}

async function findProfileOrThrow(userId: string) {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }
  return profile;
}

export async function updatePersonalInfo(
  userId: string,
  data: PersonalInfoInput,
) {
  const profile = await findProfileOrThrow(userId);
  profile.set(data);
  await profile.save();
  return profile.toJSON();
}

export async function replaceSkills(userId: string, skills: string[]) {
  const profile = await findProfileOrThrow(userId);
  profile.skills = skills;
  await profile.save();
  return profile.toJSON();
}

export async function addEducation(userId: string, entry: EducationInput) {
  const profile = await findProfileOrThrow(userId);
  profile.education.push(entry);
  await profile.save();
  return profile.toJSON();
}

export async function updateEducation(
  userId: string,
  entryId: string,
  patch: Partial<EducationInput>,
) {
  const profile = await findProfileOrThrow(userId);
  const entry = profile.education.id(entryId);

  if (!entry) {
    throw new ApiError(404, "Education entry not found");
  }

  entry.set(patch);
  await profile.save();
  return profile.toJSON();
}

export async function deleteEducation(userId: string, entryId: string) {
  const profile = await findProfileOrThrow(userId);
  const entry = profile.education.id(entryId);

  if (!entry) {
    throw new ApiError(404, "Education entry not found");
  }

  entry.deleteOne();
  await profile.save();
  return profile.toJSON();
}

export async function addExperience(userId: string, entry: ExperienceInput) {
  const profile = await findProfileOrThrow(userId);
  profile.experience.push(entry);
  await profile.save();
  return profile.toJSON();
}

export async function updateExperience(
  userId: string,
  entryId: string,
  patch: Partial<ExperienceInput>,
) {
  const profile = await findProfileOrThrow(userId);
  const entry = profile.experience.id(entryId);

  if (!entry) {
    throw new ApiError(404, "Experience entry not found");
  }

  entry.set(patch);
  await profile.save();
  return profile.toJSON();
}

export async function deleteExperience(userId: string, entryId: string) {
  const profile = await findProfileOrThrow(userId);
  const entry = profile.experience.id(entryId);

  if (!entry) {
    throw new ApiError(404, "Experience entry not found");
  }

  entry.deleteOne();
  await profile.save();
  return profile.toJSON();
}
