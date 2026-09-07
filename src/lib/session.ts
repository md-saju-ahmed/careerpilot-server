import { Types } from "mongoose";
import {
  SessionReadModel,
  buildUserIdFilter,
  UserReadModel,
} from "../modules/admin/user.readmodel.js";

export async function revokeSessionsForUser(userId: string): Promise<void> {
  let resolvedId = userId;

  if (Types.ObjectId.isValid(userId)) {
    const user = await UserReadModel.findOne(buildUserIdFilter(userId))
      .select("id")
      .lean();

    if (user) {
      const doc = user as unknown as Record<string, unknown>;
      resolvedId = (doc.id as string) ?? userId;
    }
  }

  await SessionReadModel.deleteMany({ userId: resolvedId });
}
