/** Catálogo de marcas y modelos para servicio técnico */

export const PHONE_BRANDS = {
  Samsung: {
    platform: "Android",
    models: ["Galaxy A54 128GB"],
  },
  Xiaomi: {
    platform: "Android",
    models: ["Redmi Note 13 Pro"],
  },
  Motorola: {
    platform: "Android",
    models: ["Edge 40 Neo"],
  },
  Apple: {
    platform: "iOS",
    models: ["iPhone 13 128GB", "iPhone 14 Pro 256GB", "iPhone SE 2022 64GB"],
  },
};

export function getBrandList() {
  return Object.keys(PHONE_BRANDS);
}

export function getModelsForBrand(brand) {
  return PHONE_BRANDS[brand]?.models || [];
}

export function getPlatformForBrand(brand) {
  return PHONE_BRANDS[brand]?.platform || "";
}

/**
 * Filtra repuestos compatibles con marca/modelo.
 * Los productos pueden tener device_brand, device_model y/o device_universal.
 */
export function filterPartsForDevice(parts, brand, model) {
  if (!brand || !model) return [];

  return parts.filter((part) => {
    if (part.device_universal) return true;
    if (part.device_brand && part.device_model) {
      return part.device_brand === brand && part.device_model === model;
    }
    if (part.device_brand && !part.device_model) {
      return part.device_brand === brand;
    }
    const name = part.name.toLowerCase();
    const brandKey = brand.toLowerCase();
    const modelKey = model.toLowerCase().split(" ")[0];
    if (name.includes(brandKey) && name.includes(modelKey.split(" ")[0])) return true;
    if (brand === "Apple" && name.includes("iphone") && model.toLowerCase().includes("13") && name.includes("13")) {
      return true;
    }
    if (brand === "Apple" && model.includes("14") && name.includes("14")) return true;
    if (brand === "Samsung" && model.includes("A54") && name.includes("a54")) return true;
    if (brand === "Xiaomi" && model.includes("Note 13") && name.includes("note 13")) return true;
    return false;
  });
}

export function buildBrandsFromProducts(phoneProducts) {
  const brands = {};
  for (const product of phoneProducts) {
    const brand = product.device_brand || inferBrandFromName(product.name);
    if (!brand) continue;
    if (!brands[brand]) {
      brands[brand] = { platform: product.device_platform || "", models: [] };
    }
    const model = product.device_model || product.name;
    if (!brands[brand].models.includes(model)) {
      brands[brand].models.push(model);
    }
  }
  return brands;
}

function inferBrandFromName(name) {
  const n = name.toLowerCase();
  if (n.includes("samsung")) return "Samsung";
  if (n.includes("xiaomi") || n.includes("redmi")) return "Xiaomi";
  if (n.includes("motorola")) return "Motorola";
  if (n.includes("iphone") || n.includes("apple")) return "Apple";
  return null;
}

export function getMergedBrandCatalog(phoneProducts) {
  const fromProducts = buildBrandsFromProducts(phoneProducts);
  const merged = { ...PHONE_BRANDS };
  for (const [brand, data] of Object.entries(fromProducts)) {
    if (!merged[brand]) {
      merged[brand] = data;
    } else {
      const models = new Set([...merged[brand].models, ...data.models]);
      merged[brand] = { ...merged[brand], models: [...models] };
    }
  }
  return merged;
}

export function getBrandListFromCatalog(catalog) {
  return Object.keys(catalog);
}

export function getModelsFromCatalog(catalog, brand) {
  return catalog[brand]?.models || [];
}
