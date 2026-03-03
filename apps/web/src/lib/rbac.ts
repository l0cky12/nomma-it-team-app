import { AppRole } from "@prisma/client";

export function hasMinimumRole(current: AppRole, required: AppRole): boolean {
  const rank: Record<AppRole, number> = {
    CADET_HELPER: 1,
    TECHNICIAN: 2,
    ADMIN: 3,
  };
  return rank[current] >= rank[required];
}

export function roleCanMutate(role: AppRole): boolean {
  return role === "TECHNICIAN" || role === "ADMIN";
}
