/** Organización demo: venta y reparación de teléfonos Android/iOS */

export const CHINO_TENANT_ID = "a0000000-0000-4000-8000-000000000002";
export const CHINO_BRANCH_1_ID = "b0000000-0000-4000-8000-000000000002";
export const CHINO_BRANCH_2_ID = "b0000000-0000-4000-8000-000000000003";

export const ROLE_CHINO_ADMIN = "r0000000-0000-4000-8000-000000000010";
export const ROLE_CHINO_VENDEDOR = "r0000000-0000-4000-8000-000000000011";
export const ROLE_CHINO_CONTABILIDAD = "r0000000-0000-4000-8000-000000000012";

export const CHINO_USERS = {
  admin: {
    id: "d0000000-0000-4000-8000-000000000010",
    email: "admin@chinocell.demo",
    password: "ChinoAdmin123!",
    name: "Carlos Méndez — Admin Chino Cell",
  },
  ventas1: {
    id: "d0000000-0000-4000-8000-000000000011",
    email: "ventas1@chinocell.demo",
    password: "Ventas123!",
    name: "Ana García — Ventas Suc. 1",
  },
  ventas2: {
    id: "d0000000-0000-4000-8000-000000000012",
    email: "ventas2@chinocell.demo",
    password: "Ventas123!",
    name: "Luis Torres — Ventas Suc. 2",
  },
  conta1: {
    id: "d0000000-0000-4000-8000-000000000013",
    email: "contabilidad1@chinocell.demo",
    password: "Conta123!",
    name: "María López — Contabilidad Suc. 1",
  },
  conta2: {
    id: "d0000000-0000-4000-8000-000000000014",
    email: "contabilidad2@chinocell.demo",
    password: "Conta123!",
    name: "Pedro Ruiz — Contabilidad Suc. 2",
  },
};

const ADMIN_ORG_PERMS = [
  "admin.access",
  "admin.roles",
  "admin.permisos",
  "admin.usuarios",
  "pos.vender",
  "inventario.gestionar",
  "caja.gestionar",
  "creditos.gestionar",
  "recibos.gestionar",
  "reportes.ver",
];

export function createChinoCellBundle(now = new Date()) {
  const categories = [
    { id: "cc-cat-001", tenant_id: CHINO_TENANT_ID, name: "Teléfonos Android" },
    { id: "cc-cat-002", tenant_id: CHINO_TENANT_ID, name: "Teléfonos iOS" },
    { id: "cc-cat-003", tenant_id: CHINO_TENANT_ID, name: "Repuestos Android" },
    { id: "cc-cat-004", tenant_id: CHINO_TENANT_ID, name: "Repuestos iOS" },
    { id: "cc-cat-005", tenant_id: CHINO_TENANT_ID, name: "Servicios de Reparación" },
    { id: "cc-cat-006", tenant_id: CHINO_TENANT_ID, name: "Accesorios" },
  ];

  const presentations = [
    { id: "cc-pres-001", tenant_id: CHINO_TENANT_ID, name: "Unidad" },
    { id: "cc-pres-002", tenant_id: CHINO_TENANT_ID, name: "Pieza" },
    { id: "cc-pres-003", tenant_id: CHINO_TENANT_ID, name: "Servicio" },
    { id: "cc-pres-004", tenant_id: CHINO_TENANT_ID, name: "Kit" },
    { id: "cc-pres-005", tenant_id: CHINO_TENANT_ID, name: "Par" },
  ];

  const products = [
    {
      id: "cc-prod-001",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-001",
      presentation_id: "cc-pres-001",
      name: "Samsung Galaxy A54 128GB",
      sku: "SAM-A54-128",
      barcode: "7590010000001",
      price: 2899,
      cost: 2100,
      image_url: null,
    },
    {
      id: "cc-prod-002",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-001",
      presentation_id: "cc-pres-001",
      name: "Xiaomi Redmi Note 13 Pro",
      sku: "XIA-RN13P",
      barcode: "7590010000002",
      price: 2499,
      cost: 1850,
      image_url: null,
    },
    {
      id: "cc-prod-003",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-001",
      presentation_id: "cc-pres-001",
      name: "Motorola Edge 40 Neo",
      sku: "MOT-E40N",
      barcode: "7590010000003",
      price: 3199,
      cost: 2400,
      image_url: null,
    },
    {
      id: "cc-prod-004",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-002",
      presentation_id: "cc-pres-001",
      name: "iPhone 13 128GB",
      sku: "APL-IP13-128",
      barcode: "7590010000004",
      price: 5499,
      cost: 4800,
      image_url: null,
    },
    {
      id: "cc-prod-005",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-002",
      presentation_id: "cc-pres-001",
      name: "iPhone 14 Pro 256GB",
      sku: "APL-IP14P-256",
      barcode: "7590010000005",
      price: 8999,
      cost: 7800,
      image_url: null,
    },
    {
      id: "cc-prod-006",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-002",
      presentation_id: "cc-pres-001",
      name: "iPhone SE 2022 64GB",
      sku: "APL-IPSE-64",
      barcode: "7590010000006",
      price: 3299,
      cost: 2700,
      image_url: null,
    },
    {
      id: "cc-prod-007",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-003",
      presentation_id: "cc-pres-002",
      name: "Pantalla Samsung A54 (OLED)",
      sku: "REP-SA54-PANT",
      barcode: "7590010000101",
      price: 650,
      cost: 380,
      image_url: null,
    },
    {
      id: "cc-prod-008",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-003",
      presentation_id: "cc-pres-002",
      name: "Batería Xiaomi Note 13 Pro",
      sku: "REP-XRN13-BAT",
      barcode: "7590010000102",
      price: 280,
      cost: 145,
      image_url: null,
    },
    {
      id: "cc-prod-009",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-003",
      presentation_id: "cc-pres-002",
      name: "Puerto de carga USB-C",
      sku: "REP-USBC-PORT",
      barcode: "7590010000103",
      price: 120,
      cost: 45,
      image_url: null,
    },
    {
      id: "cc-prod-010",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-004",
      presentation_id: "cc-pres-002",
      name: "Pantalla iPhone 13 (Original)",
      sku: "REP-IP13-PANT",
      barcode: "7590010000201",
      price: 1450,
      cost: 920,
      image_url: null,
    },
    {
      id: "cc-prod-011",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-004",
      presentation_id: "cc-pres-002",
      name: "Batería iPhone 13",
      sku: "REP-IP13-BAT",
      barcode: "7590010000202",
      price: 420,
      cost: 210,
      image_url: null,
    },
    {
      id: "cc-prod-012",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-004",
      presentation_id: "cc-pres-002",
      name: "Flex botón encendido iPhone 14",
      sku: "REP-IP14-FLEX",
      barcode: "7590010000203",
      price: 350,
      cost: 165,
      image_url: null,
    },
    {
      id: "cc-prod-013",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-005",
      presentation_id: "cc-pres-003",
      name: "Cambio de pantalla (mano de obra)",
      sku: "SRV-CAMB-PANT",
      barcode: "7590010000301",
      price: 250,
      cost: 80,
      image_url: null,
    },
    {
      id: "cc-prod-014",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-005",
      presentation_id: "cc-pres-003",
      name: "Diagnóstico software",
      sku: "SRV-DIAG-SW",
      barcode: "7590010000302",
      price: 150,
      cost: 40,
      image_url: null,
    },
    {
      id: "cc-prod-015",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-005",
      presentation_id: "cc-pres-003",
      name: "Flasheo / formateo Android",
      sku: "SRV-FLASH-AND",
      barcode: "7590010000303",
      price: 180,
      cost: 50,
      image_url: null,
    },
    {
      id: "cc-prod-016",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-005",
      presentation_id: "cc-pres-003",
      name: "Restauración iOS (iTunes/Finder)",
      sku: "SRV-REST-IOS",
      barcode: "7590010000304",
      price: 200,
      cost: 55,
      image_url: null,
    },
    {
      id: "cc-prod-017",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-006",
      presentation_id: "cc-pres-001",
      name: "Funda silicona universal 6.5\"",
      sku: "ACC-FUNDA-65",
      barcode: "7590010000401",
      price: 45,
      cost: 18,
      image_url: null,
    },
    {
      id: "cc-prod-018",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-006",
      presentation_id: "cc-pres-002",
      name: "Mica templada 6.1\"",
      sku: "ACC-MICA-61",
      barcode: "7590010000402",
      price: 35,
      cost: 12,
      image_url: null,
    },
    {
      id: "cc-prod-019",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-006",
      presentation_id: "cc-pres-001",
      name: "Cargador rápido 20W USB-C",
      sku: "ACC-CARG-20W",
      barcode: "7590010000403",
      price: 89,
      cost: 38,
      image_url: null,
    },
    {
      id: "cc-prod-020",
      tenant_id: CHINO_TENANT_ID,
      category_id: "cc-cat-006",
      presentation_id: "cc-pres-004",
      name: "Kit herramientas reparación",
      sku: "ACC-KIT-HERR",
      barcode: "7590010000404",
      price: 220,
      cost: 95,
      image_url: null,
    },
  ];

  const stockBranch1 = [8, 6, 4, 5, 3, 7, 15, 22, 30, 10, 18, 12, 999, 999, 999, 999, 45, 60, 25, 8];
  const stockBranch2 = [5, 8, 3, 4, 2, 5, 10, 18, 25, 8, 14, 9, 999, 999, 999, 999, 38, 55, 20, 6];

  const inventory = products.flatMap((product, index) => [
    {
      id: `cc-inv-1-${product.id}`,
      branch_id: CHINO_BRANCH_1_ID,
      product_id: product.id,
      stock: stockBranch1[index],
    },
    {
      id: `cc-inv-2-${product.id}`,
      branch_id: CHINO_BRANCH_2_ID,
      product_id: product.id,
      stock: stockBranch2[index],
    },
  ]);

  const roles = [
    {
      id: ROLE_CHINO_ADMIN,
      tenant_id: CHINO_TENANT_ID,
      name: "Administrador Chino Cell",
      slug: "admin_org",
      permissions: ADMIN_ORG_PERMS,
      is_system: true,
    },
    {
      id: ROLE_CHINO_VENDEDOR,
      tenant_id: CHINO_TENANT_ID,
      name: "Ventas",
      slug: "vendedor",
      permissions: ["pos.vender", "inventario.gestionar"],
      is_system: true,
    },
    {
      id: ROLE_CHINO_CONTABILIDAD,
      tenant_id: CHINO_TENANT_ID,
      name: "Contabilidad",
      slug: "contabilidad",
      permissions: ["caja.gestionar", "reportes.ver", "recibos.gestionar"],
      is_system: true,
    },
  ];

  const demo_users = [
    {
      id: CHINO_USERS.admin.id,
      name: CHINO_USERS.admin.name,
      email: CHINO_USERS.admin.email,
      password: CHINO_USERS.admin.password,
      tenant_id: CHINO_TENANT_ID,
      branch_id: CHINO_BRANCH_1_ID,
      role_id: ROLE_CHINO_ADMIN,
      active: true,
    },
    {
      id: CHINO_USERS.ventas1.id,
      name: CHINO_USERS.ventas1.name,
      email: CHINO_USERS.ventas1.email,
      password: CHINO_USERS.ventas1.password,
      tenant_id: CHINO_TENANT_ID,
      branch_id: CHINO_BRANCH_1_ID,
      role_id: ROLE_CHINO_VENDEDOR,
      active: true,
    },
    {
      id: CHINO_USERS.ventas2.id,
      name: CHINO_USERS.ventas2.name,
      email: CHINO_USERS.ventas2.email,
      password: CHINO_USERS.ventas2.password,
      tenant_id: CHINO_TENANT_ID,
      branch_id: CHINO_BRANCH_2_ID,
      role_id: ROLE_CHINO_VENDEDOR,
      active: true,
    },
    {
      id: CHINO_USERS.conta1.id,
      name: CHINO_USERS.conta1.name,
      email: CHINO_USERS.conta1.email,
      password: CHINO_USERS.conta1.password,
      tenant_id: CHINO_TENANT_ID,
      branch_id: CHINO_BRANCH_1_ID,
      role_id: ROLE_CHINO_CONTABILIDAD,
      active: true,
    },
    {
      id: CHINO_USERS.conta2.id,
      name: CHINO_USERS.conta2.name,
      email: CHINO_USERS.conta2.email,
      password: CHINO_USERS.conta2.password,
      tenant_id: CHINO_TENANT_ID,
      branch_id: CHINO_BRANCH_2_ID,
      role_id: ROLE_CHINO_CONTABILIDAD,
      active: true,
    },
  ];

  const users_profiles = demo_users.map((user, index) => ({
    id: `cc-profile-${String(index + 1).padStart(3, "0")}`,
    user_id: user.id,
    tenant_id: user.tenant_id,
    branch_id: user.branch_id,
    role_id: user.role_id,
    role: roles.find((r) => r.id === user.role_id)?.slug || "vendedor",
  }));

  return {
    tenants: [
      {
        id: CHINO_TENANT_ID,
        name: "Chino Cell",
        slug: "chino-cell",
        description:
          "Venta de teléfonos y reparación de todas las marcas — Android, iOS y repuestos.",
        created_at: now.toISOString(),
      },
    ],
    branches: [
      {
        id: CHINO_BRANCH_1_ID,
        tenant_id: CHINO_TENANT_ID,
        name: "Chino Cel 1",
        address: "Zona 10, 12 Calle 2-34, Guatemala",
      },
      {
        id: CHINO_BRANCH_2_ID,
        tenant_id: CHINO_TENANT_ID,
        name: "Chino Cel 2",
        address: "Calzada Roosevelt 25-89, Mixco",
      },
    ],
    roles,
    demo_users,
    users_profiles,
    categories,
    presentations,
    products,
    inventory,
    sales: [],
    sales_details: [],
    credit_payments: [],
    cash_registers: [],
  };
}

export function mergeChinoCellIfMissing(store, initialFull) {
  const hasChino = store.tenants?.some((t) => t.id === CHINO_TENANT_ID);
  if (hasChino) return store;

  const chino = createChinoCellBundle();
  const chinoRoles = chino.roles.filter(
    (r) => !store.roles?.some((existing) => existing.id === r.id)
  );

  return {
    ...store,
    tenants: [...(store.tenants || []), ...chino.tenants],
    branches: [...(store.branches || []), ...chino.branches],
    roles: [...(store.roles || []), ...chinoRoles],
    demo_users: [...(store.demo_users || []), ...chino.demo_users],
    users_profiles: [...(store.users_profiles || []), ...chino.users_profiles],
    categories: [...(store.categories || []), ...chino.categories],
    presentations: [...(store.presentations || []), ...chino.presentations],
    products: [...(store.products || []), ...chino.products],
    inventory: [...(store.inventory || []), ...chino.inventory],
  };
}

export function mergeBundles(base, chino) {
  return {
    ...base,
    tenants: [...base.tenants, ...chino.tenants],
    branches: [...base.branches, ...chino.branches],
    roles: [...base.roles, ...chino.roles],
    demo_users: [...base.demo_users, ...chino.demo_users],
    users_profiles: [...base.users_profiles, ...chino.users_profiles],
    categories: [...base.categories, ...chino.categories],
    presentations: [...base.presentations, ...chino.presentations],
    products: [...base.products, ...chino.products],
    inventory: [...base.inventory, ...chino.inventory],
    sales: [...(base.sales || []), ...(chino.sales || [])],
    sales_details: [...(base.sales_details || []), ...(chino.sales_details || [])],
    credit_payments: [...(base.credit_payments || []), ...(chino.credit_payments || [])],
    cash_registers: [...(base.cash_registers || []), ...(chino.cash_registers || [])],
  };
}
