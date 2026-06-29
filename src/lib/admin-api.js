import { isDemoMode } from "./demo-mode";
import { getDemoStore, updateDemoStore, uuid } from "./demo/store";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_CATALOG,
  groupPermissionsByModule,
} from "./permissions";

function isSuperAdmin(store, userId) {
  const profile = store.users_profiles.find((p) => p.user_id === userId);
  if (!profile) return false;
  const role = store.roles?.find((r) => r.id === profile.role_id);
  return role?.slug === "super_admin";
}

function resolveRole(store, profile) {
  const role = (store.roles || []).find((r) => r.id === profile.role_id);
  if (role) {
    const permissions =
      role.permissions?.includes("*") ? ALL_PERMISSION_KEYS : role.permissions || [];
    return { ...role, permissions };
  }
  if (profile.role === "admin_org") {
    return {
      id: "legacy-admin",
      slug: "admin_org",
      name: "Admin Organización",
      permissions: ALL_PERMISSION_KEYS.filter((k) => k !== "admin.organizaciones"),
    };
  }
  return {
    id: "legacy-vendedor",
    slug: "vendedor",
    name: "Vendedor",
    permissions: ["pos.vender", "reportes.ver"],
  };
}

export async function getPermissionsCatalog() {
  return {
    data: PERMISSION_CATALOG,
    grouped: groupPermissionsByModule(),
    error: null,
  };
}

export async function getOrganizations() {
  if (!isDemoMode()) {
    return { data: [], error: { message: "Disponible en modo demo." } };
  }
  const store = getDemoStore();
  const orgs = store.tenants.map((tenant) => ({
    ...tenant,
    branches: store.branches.filter((b) => b.tenant_id === tenant.id),
    userCount: store.users_profiles.filter((p) => p.tenant_id === tenant.id).length,
  }));
  return { data: orgs, error: null };
}

export async function saveOrganization({ editing, name, branchName, address }) {
  if (!name?.trim()) return { error: { message: "Nombre de organización requerido." } };

  if (isDemoMode()) {
    if (editing) {
      updateDemoStore((data) => ({
        ...data,
        tenants: data.tenants.map((t) =>
          t.id === editing.id ? { ...t, name: name.trim() } : t
        ),
        branches: data.branches.map((b) =>
          b.tenant_id === editing.id && b.id === editing.mainBranchId
            ? { ...b, name: branchName?.trim() || b.name, address: address || b.address }
            : b
        ),
      }));
    } else {
      const tenantId = uuid();
      const branchId = uuid();
      updateDemoStore((data) => ({
        ...data,
        tenants: [
          ...data.tenants,
          { id: tenantId, name: name.trim(), created_at: new Date().toISOString() },
        ],
        branches: [
          ...data.branches,
          {
            id: branchId,
            tenant_id: tenantId,
            name: branchName?.trim() || "Sucursal Principal",
            address: address || "",
          },
        ],
        categories: [
          ...(data.categories || []),
          { id: uuid(), tenant_id: tenantId, name: "General" },
        ],
        presentations: [
          ...(data.presentations || []),
          { id: uuid(), tenant_id: tenantId, name: "Unidad" },
        ],
      }));
    }
    return { error: null };
  }
  return { error: { message: "Conecte Supabase para producción." } };
}

export async function deleteOrganization(orgId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    if (store.tenants.length <= 1) {
      return { error: { message: "Debe existir al menos una organización." } };
    }
    const hasUsers = store.users_profiles.some((p) => p.tenant_id === orgId);
    if (hasUsers) {
      return { error: { message: "No se puede eliminar: tiene usuarios asignados." } };
    }
    updateDemoStore((data) => ({
      ...data,
      tenants: data.tenants.filter((t) => t.id !== orgId),
      branches: data.branches.filter((b) => b.tenant_id !== orgId),
      products: data.products.filter((p) => p.tenant_id !== orgId),
      categories: (data.categories || []).filter((c) => c.tenant_id !== orgId),
      presentations: (data.presentations || []).filter((p) => p.tenant_id !== orgId),
      roles: (data.roles || []).filter((r) => r.tenant_id !== orgId),
    }));
    return { error: null };
  }
  return { error: { message: "Conecte Supabase para producción." } };
}

export async function getRoles(tenantId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const roles = (store.roles || []).filter(
      (r) => r.tenant_id === null || r.tenant_id === tenantId
    );
    return { data: roles, error: null };
  }
  return { data: [], error: null };
}

export async function saveRole({ editing, tenantId, name, permissions, slug }) {
  if (!name?.trim()) return { error: { message: "Nombre del rol requerido." } };
  if (!permissions?.length) {
    return { error: { message: "Seleccione al menos un permiso." } };
  }

  if (isDemoMode()) {
    const roleSlug =
      slug ||
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    if (editing) {
      if (editing.is_system) {
        return { error: { message: "Los roles del sistema no se pueden editar." } };
      }
      updateDemoStore((data) => ({
        ...data,
        roles: data.roles.map((r) =>
          r.id === editing.id
            ? { ...r, name: name.trim(), slug: roleSlug, permissions }
            : r
        ),
      }));
    } else {
      updateDemoStore((data) => ({
        ...data,
        roles: [
          ...(data.roles || []),
          {
            id: uuid(),
            tenant_id: tenantId,
            name: name.trim(),
            slug: roleSlug,
            permissions,
            is_system: false,
          },
        ],
      }));
    }
    return { error: null };
  }
  return { error: { message: "Conecte Supabase para producción." } };
}

export async function deleteRole(roleId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const role = store.roles?.find((r) => r.id === roleId);
    if (!role) return { error: { message: "Rol no encontrado." } };
    if (role.is_system) {
      return { error: { message: "No se puede eliminar un rol del sistema." } };
    }
    const inUse = store.users_profiles.some((p) => p.role_id === roleId);
    if (inUse) {
      return { error: { message: "El rol está asignado a usuarios." } };
    }
    updateDemoStore((data) => ({
      ...data,
      roles: data.roles.filter((r) => r.id !== roleId),
    }));
    return { error: null };
  }
  return { error: null };
}

export async function getAdminUsers(tenantId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const users = (store.demo_users || [])
      .filter((u) => !tenantId || u.tenant_id === tenantId)
      .map((user) => {
        const profile = store.users_profiles.find((p) => p.user_id === user.id);
        const role = store.roles?.find((r) => r.id === profile?.role_id);
        const tenant = store.tenants.find((t) => t.id === user.tenant_id);
        const branch = store.branches.find((b) => b.id === user.branch_id);
        return { ...user, profile, role, tenant, branch, password: undefined };
      });
    return { data: users, error: null };
  }
  return { data: [], error: null };
}

export async function saveAdminUser({
  editing,
  name,
  email,
  password,
  tenantId,
  branchId,
  roleId,
  active = true,
}) {
  if (!name?.trim() || !email?.trim()) {
    return { error: { message: "Nombre y correo son requeridos." } };
  }
  if (!tenantId || !branchId || !roleId) {
    return { error: { message: "Organización, sucursal y rol son requeridos." } };
  }
  if (!editing && !password?.trim()) {
    return { error: { message: "Contraseña requerida para usuario nuevo." } };
  }

  if (isDemoMode()) {
    const store = getDemoStore();
    const emailExists = store.demo_users.some(
      (u) => u.email === email.trim().toLowerCase() && u.id !== editing?.id
    );
    if (emailExists) {
      return { error: { message: "El correo ya está registrado." } };
    }

    const role = store.roles.find((r) => r.id === roleId);
    const roleSlug = role?.slug || "vendedor";

    if (editing) {
      updateDemoStore((data) => ({
        ...data,
        demo_users: data.demo_users.map((u) =>
          u.id === editing.id
            ? {
                ...u,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: password?.trim() ? password : u.password,
                tenant_id: tenantId,
                branch_id: branchId,
                role_id: roleId,
                active,
              }
            : u
        ),
        users_profiles: data.users_profiles.map((p) =>
          p.user_id === editing.id
            ? {
                ...p,
                tenant_id: tenantId,
                branch_id: branchId,
                role_id: roleId,
                role: roleSlug,
              }
            : p
        ),
      }));
    } else {
      const userId = uuid();
      updateDemoStore((data) => ({
        ...data,
        demo_users: [
          ...(data.demo_users || []),
          {
            id: userId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            tenant_id: tenantId,
            branch_id: branchId,
            role_id: roleId,
            active,
          },
        ],
        users_profiles: [
          ...data.users_profiles,
          {
            id: uuid(),
            user_id: userId,
            tenant_id: tenantId,
            branch_id: branchId,
            role_id: roleId,
            role: roleSlug,
          },
        ],
      }));
    }
    return { error: null };
  }
  return { error: { message: "Conecte Supabase para producción." } };
}

export async function deleteAdminUser(userId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const user = store.demo_users?.find((u) => u.id === userId);
    if (user?.email === "superadmin@pos.demo") {
      return { error: { message: "No se puede eliminar el superadministrador." } };
    }
    updateDemoStore((data) => ({
      ...data,
      demo_users: data.demo_users.filter((u) => u.id !== userId),
      users_profiles: data.users_profiles.filter((p) => p.user_id !== userId),
    }));
    return { error: null };
  }
  return { error: null };
}

export function getUserPermissionsFromStore(userId) {
  const store = getDemoStore();
  const profile = store.users_profiles.find((p) => p.user_id === userId);
  if (!profile) return [];
  const role = resolveRole(store, profile);
  return role.permissions;
}

export { resolveRole, isSuperAdmin };
