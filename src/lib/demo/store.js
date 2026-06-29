import { createInitialDemoData } from "./seed";
import { mergeChinoCellIfMissing } from "./chino-cell-seed";

const STORAGE_KEY = "pos-demo-data";

function migrateStore(data) {
  const initial = createInitialDemoData();
  let migrated = { ...data };

  if (!migrated.categories) {
    migrated.categories = initial.categories;
  }
  if (!migrated.presentations) {
    migrated.presentations = initial.presentations;
  }
  if (!migrated.roles?.length) {
    migrated.roles = initial.roles;
  }
  if (!migrated.demo_users?.length) {
    migrated.demo_users = initial.demo_users;
  }

  migrated.users_profiles = (migrated.users_profiles || []).map((profile) => {
    if (profile.role_id) return profile;
    const role = migrated.roles.find((r) => r.slug === profile.role);
    return { ...profile, role_id: role?.id || initial.roles[0]?.id };
  });

  const existingUserIds = new Set(migrated.users_profiles.map((p) => p.user_id));
  for (const demoUser of initial.demo_users) {
    if (!existingUserIds.has(demoUser.id)) {
      migrated.demo_users = [...(migrated.demo_users || []), demoUser];
      migrated.users_profiles = [
        ...migrated.users_profiles,
        {
          id: `p-${demoUser.id}`,
          user_id: demoUser.id,
          tenant_id: demoUser.tenant_id,
          branch_id: demoUser.branch_id,
          role_id: demoUser.role_id,
          role: initial.roles.find((r) => r.id === demoUser.role_id)?.slug || "vendedor",
        },
      ];
    }
  }

  migrated.products = (migrated.products || []).map((product) => ({
    ...product,
    category_id: product.category_id || initial.categories[0]?.id || null,
    presentation_id: product.presentation_id || initial.presentations[0]?.id || null,
    image_url: product.image_url || null,
  }));

  migrated = mergeChinoCellIfMissing(migrated, initial);

  return migrated;
}

function readStore() {
  if (typeof window === "undefined") return createInitialDemoData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createInitialDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  const parsed = JSON.parse(raw);
  const migrated = migrateStore(parsed);
  if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }
  return migrated;
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetDemoStore() {
  const initial = createInitialDemoData();
  writeStore(initial);
  return initial;
}

export function getDemoStore() {
  return readStore();
}

export function updateDemoStore(updater) {
  const data = readStore();
  const next = typeof updater === "function" ? updater(data) : updater;
  writeStore(next);
  return next;
}

export function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
