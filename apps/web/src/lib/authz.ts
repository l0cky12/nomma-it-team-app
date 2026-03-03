import { AppRole } from "@prisma/client";
import { auth } from "@/auth";
import { hasMinimumRole } from "./rbac";

export async function requireUser(requiredRole: AppRole = "CADET_HELPER") {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }
  if (!hasMinimumRole(session.user.role as AppRole, requiredRole)) {
    throw new Error("FORBIDDEN");
  }
  return {
    id: session.user.id,
    role: session.user.role as AppRole,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
}
