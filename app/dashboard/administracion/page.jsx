"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { usePermissions } from "@/src/hooks/usePermissions";
import {
  getOrganizations,
  saveOrganization,
  deleteOrganization,
  getRoles,
  saveRole,
  deleteRole,
  getPermissionsCatalog,
  getAdminUsers,
  saveAdminUser,
  deleteAdminUser,
} from "@/src/lib/admin-api";
import { getDemoStore } from "@/src/lib/demo/store";
import { groupPermissionsByModule } from "@/src/lib/permissions";

const TABS = [
  { id: "organizaciones", label: "Organizaciones", perm: "admin.organizaciones" },
  { id: "roles", label: "Roles", perm: "admin.roles" },
  { id: "permisos", label: "Permisos", perm: "admin.permisos" },
  { id: "usuarios", label: "Usuarios", perm: "admin.usuarios" },
];

export default function AdministracionPage() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const { can, isAdmin } = usePermissions();

  const [tab, setTab] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [permCatalog, setPermCatalog] = useState([]);
  const [permGrouped, setPermGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const [showOrgForm, setShowOrgForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgForm, setOrgForm] = useState({ name: "", branchName: "", address: "" });

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    tenant_id: "",
    branch_id: "",
    role_id: "",
    active: true,
  });

  const isSuperAdmin = profile?.role === "super_admin";
  const visibleTabs = TABS.filter((t) => can(t.perm));

  const branchesForTenant = useMemo(() => {
    if (!userForm.tenant_id) return [];
    const store = getDemoStore();
    return store.branches.filter((b) => b.tenant_id === userForm.tenant_id);
  }, [userForm.tenant_id, orgs, users]);

  const rolesForTenant = useMemo(() => {
    if (!userForm.tenant_id) return roles;
    return roles.filter((r) => r.tenant_id === null || r.tenant_id === userForm.tenant_id);
  }, [userForm.tenant_id, roles]);

  useEffect(() => {
    if (!profile) return;
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (visibleTabs.length && !tab) {
      setTab(visibleTabs[0].id);
    }
  }, [profile, isAdmin, visibleTabs, tab, router]);

  async function loadAll() {
    if (!profile) return;
    setLoading(true);

    const tenantFilter = isSuperAdmin ? null : profile.tenant_id;

    const [orgRes, roleRes, userRes, permRes] = await Promise.all([
      getOrganizations(),
      getRoles(profile.tenant_id),
      getAdminUsers(tenantFilter),
      getPermissionsCatalog(),
    ]);

    let orgList = orgRes.data || [];
    if (!isSuperAdmin) {
      orgList = orgList.filter((o) => o.id === profile.tenant_id);
    }

    setOrgs(orgList);
    setRoles(roleRes.data || []);
    setUsers(userRes.data || []);
    setPermCatalog(permRes.data || []);
    setPermGrouped(permRes.grouped || groupPermissionsByModule());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [profile?.tenant_id, profile?.role]);

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  }

  async function handleSaveOrg(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await saveOrganization({
      editing: editingOrg,
      name: orgForm.name,
      branchName: orgForm.branchName,
      address: orgForm.address,
    });
    setSaving(false);
    if (error) return flash("error", error.message);
    flash("success", editingOrg ? "Organización actualizada." : "Organización creada.");
    setShowOrgForm(false);
    setEditingOrg(null);
    setOrgForm({ name: "", branchName: "", address: "" });
    loadAll();
  }

  async function handleDeleteOrg(org) {
    if (!confirm(`¿Eliminar "${org.name}"?`)) return;
    const { error } = await deleteOrganization(org.id);
    if (error) return flash("error", error.message);
    flash("success", "Organización eliminada.");
    loadAll();
  }

  function openEditOrg(org) {
    const mainBranch = org.branches?.[0];
    setEditingOrg({ id: org.id, mainBranchId: mainBranch?.id });
    setOrgForm({
      name: org.name,
      branchName: mainBranch?.name || "",
      address: mainBranch?.address || "",
    });
    setShowOrgForm(true);
  }

  async function handleSaveRole(e) {
    e.preventDefault();
    setSaving(true);
    const tenantId = isSuperAdmin && !editingRole ? profile.tenant_id : profile.tenant_id;
    const { error } = await saveRole({
      editing: editingRole,
      tenantId: editingRole?.tenant_id ?? tenantId,
      name: roleForm.name,
      permissions: roleForm.permissions,
    });
    setSaving(false);
    if (error) return flash("error", error.message);
    flash("success", editingRole ? "Rol actualizado." : "Rol creado.");
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleForm({ name: "", permissions: [] });
    loadAll();
  }

  async function handleDeleteRole(role) {
    if (!confirm(`¿Eliminar rol "${role.name}"?`)) return;
    const { error } = await deleteRole(role.id);
    if (error) return flash("error", error.message);
    flash("success", "Rol eliminado.");
    loadAll();
  }

  function toggleRolePermission(key) {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await saveAdminUser({
      editing: editingUser,
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      tenantId: isSuperAdmin ? userForm.tenant_id : profile.tenant_id,
      branchId: userForm.branch_id,
      roleId: userForm.role_id,
      active: userForm.active,
    });
    setSaving(false);
    if (error) return flash("error", error.message);
    flash("success", editingUser ? "Usuario actualizado." : "Usuario creado.");
    setShowUserForm(false);
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      tenant_id: profile.tenant_id,
      branch_id: "",
      role_id: "",
      active: true,
    });
    loadAll();
  }

  async function handleDeleteUser(user) {
    if (!confirm(`¿Eliminar usuario "${user.name}"?`)) return;
    const { error } = await deleteAdminUser(user.id);
    if (error) return flash("error", error.message);
    flash("success", "Usuario eliminado.");
    loadAll();
  }

  function openNewUser() {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      tenant_id: profile.tenant_id,
      branch_id: profile.branch_id,
      role_id: roles.find((r) => r.slug === "vendedor")?.id || "",
      active: true,
    });
    setShowUserForm(true);
  }

  if (!profile || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administración</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organizaciones, roles, permisos y usuarios del sistema
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-indigo-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {tab === "organizaciones" && can("admin.organizaciones") && (
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Organizaciones</h2>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setEditingOrg(null);
                      setOrgForm({ name: "", branchName: "Sucursal Principal", address: "" });
                      setShowOrgForm(true);
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    + Nueva organización
                  </button>
                )}
              </div>

              {showOrgForm && (
                <form
                  onSubmit={handleSaveOrg}
                  className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4"
                >
                  <h3 className="mb-3 font-medium text-slate-800">
                    {editingOrg ? "Editar organización" : "Nueva organización"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      placeholder="Nombre de la organización"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                    <input
                      placeholder="Nombre sucursal principal"
                      value={orgForm.branchName}
                      onChange={(e) => setOrgForm({ ...orgForm, branchName: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Dirección"
                      value={orgForm.address}
                      onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOrgForm(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="pb-2 font-medium">Nombre</th>
                      <th className="pb-2 font-medium">Sucursales</th>
                      <th className="pb-2 font-medium">Usuarios</th>
                      <th className="pb-2 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((org) => (
                      <tr key={org.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium text-slate-900">{org.name}</td>
                        <td className="py-3 text-slate-600">{org.branches?.length || 0}</td>
                        <td className="py-3 text-slate-600">{org.userCount || 0}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditOrg(org)}
                              className="text-indigo-600 hover:underline"
                            >
                              Editar
                            </button>
                            {isSuperAdmin && orgs.length > 1 && (
                              <button
                                onClick={() => handleDeleteOrg(org)}
                                className="text-red-600 hover:underline"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "roles" && can("admin.roles") && (
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Roles</h2>
                <button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleForm({ name: "", permissions: [] });
                    setShowRoleForm(true);
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  + Nuevo rol
                </button>
              </div>

              {showRoleForm && (
                <form
                  onSubmit={handleSaveRole}
                  className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4"
                >
                  <h3 className="mb-3 font-medium text-slate-800">
                    {editingRole ? "Editar rol" : "Nuevo rol"}
                  </h3>
                  <input
                    placeholder="Nombre del rol"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                    disabled={editingRole?.is_system}
                  />
                  <p className="mb-2 text-xs font-medium text-slate-600">Permisos</p>
                  <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                    {Object.entries(groupPermissionsByModule(permCatalog)).map(
                      ([module, perms]) => (
                        <div key={module}>
                          <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                            {module}
                          </p>
                          <div className="space-y-1">
                            {perms.map((perm) => (
                              <label
                                key={perm.key}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={roleForm.permissions.includes(perm.key)}
                                  onChange={() => toggleRolePermission(perm.key)}
                                  disabled={editingRole?.is_system}
                                />
                                {perm.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  {!editingRole?.is_system && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRoleForm(false)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="pb-2 font-medium">Nombre</th>
                      <th className="pb-2 font-medium">Slug</th>
                      <th className="pb-2 font-medium">Permisos</th>
                      <th className="pb-2 font-medium">Tipo</th>
                      <th className="pb-2 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium text-slate-900">{role.name}</td>
                        <td className="py-3 text-slate-600">{role.slug}</td>
                        <td className="py-3 text-slate-600">
                          {role.permissions?.includes("*")
                            ? "Todos"
                            : `${role.permissions?.length || 0} permisos`}
                        </td>
                        <td className="py-3">
                          {role.is_system ? (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">Sistema</span>
                          ) : (
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                              Personalizado
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingRole(role);
                                setRoleForm({
                                  name: role.name,
                                  permissions: role.permissions?.includes("*")
                                    ? permCatalog.map((p) => p.key)
                                    : [...(role.permissions || [])],
                                });
                                setShowRoleForm(true);
                              }}
                              className="text-indigo-600 hover:underline"
                            >
                              {role.is_system ? "Ver" : "Editar"}
                            </button>
                            {!role.is_system && (
                              <button
                                onClick={() => handleDeleteRole(role)}
                                className="text-red-600 hover:underline"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "permisos" && can("admin.permisos") && (
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Catálogo de permisos
              </h2>
              <p className="mb-6 text-sm text-slate-500">
                Permisos disponibles en el sistema. Asígnelos a roles desde la pestaña Roles.
              </p>
              <div className="space-y-6">
                {Object.entries(permGrouped).map(([module, perms]) => (
                  <div key={module}>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                      {module}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {perms.map((perm) => (
                        <div
                          key={perm.key}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                          <p className="font-medium text-slate-800">{perm.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-slate-400">{perm.key}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "usuarios" && can("admin.usuarios") && (
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Usuarios</h2>
                <button
                  onClick={openNewUser}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  + Nuevo usuario
                </button>
              </div>

              {showUserForm && (
                <form
                  onSubmit={handleSaveUser}
                  className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4"
                >
                  <h3 className="mb-3 font-medium text-slate-800">
                    {editingUser ? "Editar usuario" : "Nuevo usuario"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      placeholder="Nombre completo"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                    <input
                      type="password"
                      placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required={!editingUser}
                    />
                    {isSuperAdmin && (
                      <select
                        value={userForm.tenant_id}
                        onChange={(e) =>
                          setUserForm({
                            ...userForm,
                            tenant_id: e.target.value,
                            branch_id: "",
                          })
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Organización</option>
                        {orgs.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <select
                      value={userForm.branch_id}
                      onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Sucursal</option>
                      {branchesForTenant.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={userForm.role_id}
                      onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Rol</option>
                      {rolesForTenant.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={userForm.active}
                        onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                      />
                      Usuario activo
                    </label>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUserForm(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="pb-2 font-medium">Nombre</th>
                      <th className="pb-2 font-medium">Correo</th>
                      <th className="pb-2 font-medium">Rol</th>
                      <th className="pb-2 font-medium">Organización</th>
                      <th className="pb-2 font-medium">Estado</th>
                      <th className="pb-2 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium text-slate-900">{user.name}</td>
                        <td className="py-3 text-slate-600">{user.email}</td>
                        <td className="py-3 text-slate-600">{user.role?.name || "—"}</td>
                        <td className="py-3 text-slate-600">{user.tenant?.name || "—"}</td>
                        <td className="py-3">
                          {user.active !== false ? (
                            <span className="text-emerald-600">Activo</span>
                          ) : (
                            <span className="text-slate-400">Inactivo</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setUserForm({
                                  name: user.name,
                                  email: user.email,
                                  password: "",
                                  tenant_id: user.tenant_id,
                                  branch_id: user.branch_id,
                                  role_id: user.role_id,
                                  active: user.active !== false,
                                });
                                setShowUserForm(true);
                              }}
                              className="text-indigo-600 hover:underline"
                            >
                              Editar
                            </button>
                            {user.email !== "superadmin@pos.demo" && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:underline"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
