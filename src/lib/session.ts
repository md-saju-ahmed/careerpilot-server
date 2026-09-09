import { Types } from "mongoose";
import { SessionReadModel } from "../modules/admin/user.readmodel.js";
import { requireObjectIdFilter } from "./mongoFilterGuard.js";

export async function revokeSessionsForUser(
  userId: Types.ObjectId,
): Promise<void> {
  requireObjectIdFilter("userId", userId);
  const filter = { userId };

  const [matching, total] = await Promise.all([
    SessionReadModel.collection.countDocuments(filter),
    SessionReadModel.collection.countDocuments({}),
  ]);
  if (total > 3 && matching === total) {
    throw new Error(
      `revokeSessionsForUser: filter for userId=${userId.toString()} ` +
        `matches all ${total} documents in \`session\`. Refusing to run ` +
        `a delete that looks unscoped -- check that the filter is ` +
        `actually reaching MongoDB as built (see comment above).`,
    );
  }

  await SessionReadModel.collection.deleteMany(filter);
}
