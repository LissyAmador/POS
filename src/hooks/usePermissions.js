"use client";

import { useUserProfile } from "@/src/hooks/useUserProfile";
import { hasPermission } from "@/src/lib/permissions";

export function usePermissions() {
  const { profile } = useUserProfile();
  const permissions = profile?.permissions || [];

  function can(key) {
    return hasPermission(permissions, key);
  }

  return {
    permissions,
    can,
    isAdmin: can("admin.access"),
  };
}
