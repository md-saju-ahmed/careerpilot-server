export const ROLES = ["user", "admin"] as const;

export type Role = (typeof ROLES)[number];

export function isKnownRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
