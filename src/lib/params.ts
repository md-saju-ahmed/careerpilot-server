import { ApiError } from "./ApiError.js";

export function requireParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (Array.isArray(value)) {
    throw new ApiError(400, `Invalid path parameter: ${name}`);
  }
  if (!value) {
    throw new ApiError(400, `Missing required path parameter: ${name}`);
  }
  return value;
}
