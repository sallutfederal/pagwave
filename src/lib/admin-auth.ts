export const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.has(role.trim().toUpperCase());
}

