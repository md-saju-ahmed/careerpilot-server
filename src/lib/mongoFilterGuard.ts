import { Types } from "mongoose";

export function requireNonEmptyFilter(filter: Record<string, unknown>): void {
  const keys = Object.keys(filter);

  if (keys.length === 0 || keys.some((key) => filter[key] === undefined)) {
    throw new Error("Refusing to run a delete with an empty/undefined filter");
  }
}

export function requireObjectIdFilter(
  fieldName: string,
  value: unknown,
): asserts value is Types.ObjectId {
  if (!(value instanceof Types.ObjectId)) {
    throw new Error(
      `Refusing to run a delete: expected "${fieldName}" to be an ObjectId, ` +
        `got ${value === undefined ? "undefined" : typeof value}. ` +
        `This would otherwise risk a filter that matches every document.`,
    );
  }
}
