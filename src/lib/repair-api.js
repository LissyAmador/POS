import { isDemoMode } from "./demo-mode";
import { getDemoStore, updateDemoStore, uuid } from "./demo/store";
import {
  calculateRepairTotal,
  generateTicketPassword,
  getRepairTicketNumber,
} from "./repair-utils";

const SERVICE_CATEGORY_NAMES = new Set([
  "Servicios de Reparación",
  "servicios de reparación",
]);

const PARTS_CATEGORY_NAMES = new Set([
  "Repuestos Android",
  "Repuestos iOS",
  "repuestos android",
  "repuestos ios",
]);

function enrichProduct(store, product, branchId) {
  const inv = store.inventory.find(
    (i) => i.branch_id === branchId && i.product_id === product.id
  );
  const category = (store.categories || []).find((c) => c.id === product.category_id);
  return {
    ...product,
    stock: inv?.stock ?? 0,
    category,
    category_name: category?.name || "Sin categoría",
  };
}

export async function getTechnicians(tenantId, branchId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const techs = (store.technicians || []).filter(
      (t) => t.tenant_id === tenantId && t.branch_id === branchId && t.active !== false
    );
    return { data: techs, error: null };
  }
  return { data: [], error: null };
}

export async function getRepairCatalog(tenantId, branchId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const products = store.products
      .filter((p) => p.tenant_id === tenantId)
      .map((p) => enrichProduct(store, p, branchId));

    const services = products.filter((p) =>
      SERVICE_CATEGORY_NAMES.has(p.category_name)
    );
    const parts = products.filter(
      (p) => PARTS_CATEGORY_NAMES.has(p.category_name) && p.stock > 0
    );

    return { data: { services, parts }, error: null };
  }
  return { data: { services: [], parts: [] }, error: null };
}

export async function getRepairOrders(branchId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const orders = (store.repair_orders || [])
      .filter((o) => o.branch_id === branchId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((order) => ({
        ...order,
        ticket_number: order.ticket_number || getRepairTicketNumber(order.id, branchId),
      }));
    return { data: orders, error: null };
  }
  return { data: [], error: null };
}

export async function createRepairOrder({
  tenantId,
  branchId,
  userId,
  clientName,
  clientPhone,
  deviceBrand,
  deviceModel,
  deviceCondition,
  conditionNotes,
  repairServiceId,
  repairServiceName,
  laborCost,
  parts,
  technicianId,
  technicianName,
  estimatedCompletion,
  notes,
}) {
  if (!clientName?.trim()) {
    return { error: { message: "Nombre del cliente requerido." } };
  }
  if (!clientPhone?.trim()) {
    return { error: { message: "Teléfono del cliente requerido." } };
  }
  if (!deviceBrand?.trim() || !deviceModel?.trim()) {
    return { error: { message: "Marca y modelo del equipo requeridos." } };
  }
  if (!deviceCondition) {
    return { error: { message: "Seleccione el estado del teléfono." } };
  }
  if (!repairServiceId) {
    return { error: { message: "Seleccione el tipo de reparación." } };
  }
  if (!technicianId) {
    return { error: { message: "Asigne un técnico." } };
  }
  if (!estimatedCompletion) {
    return { error: { message: "Indique la fecha estimada de entrega." } };
  }

  if (isDemoMode()) {
    const store = getDemoStore();

    for (const part of parts || []) {
      const inv = store.inventory.find(
        (i) => i.branch_id === branchId && i.product_id === part.product_id
      );
      if (!inv || inv.stock < part.quantity) {
        return {
          error: {
            message: `Stock insuficiente para ${part.product_name || "repuesto"}.`,
          },
        };
      }
    }

    const orderId = uuid();
    const ticketPassword = generateTicketPassword();
    const totalCost = calculateRepairTotal(laborCost, parts);

    const order = {
      id: orderId,
      tenant_id: tenantId,
      branch_id: branchId,
      user_id: userId,
      ticket_number: getRepairTicketNumber(orderId, branchId),
      ticket_password: ticketPassword,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      device_brand: deviceBrand.trim(),
      device_model: deviceModel.trim(),
      device_condition: deviceCondition,
      condition_notes: conditionNotes?.trim() || "",
      repair_service_id: repairServiceId,
      repair_service_name: repairServiceName,
      labor_cost: Number(laborCost) || 0,
      parts: parts || [],
      technician_id: technicianId,
      technician_name: technicianName,
      estimated_completion: estimatedCompletion,
      notes: notes?.trim() || "",
      total_cost: totalCost,
      status: "recibido",
      created_at: new Date().toISOString(),
    };

    updateDemoStore((data) => {
      let inventory = [...data.inventory];
      for (const part of parts || []) {
        inventory = inventory.map((item) =>
          item.branch_id === branchId && item.product_id === part.product_id
            ? { ...item, stock: item.stock - part.quantity }
            : item
        );
      }

      return {
        ...data,
        repair_orders: [...(data.repair_orders || []), order],
        inventory,
      };
    });

    return { data: order, error: null };
  }

  return { error: { message: "Conecte Supabase para producción." } };
}

export async function updateRepairOrderStatus(orderId, status) {
  if (isDemoMode()) {
    updateDemoStore((data) => ({
      ...data,
      repair_orders: (data.repair_orders || []).map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
    }));
    return { error: null };
  }
  return { error: null };
}

export async function getRepairOrderById(orderId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const order = (store.repair_orders || []).find((o) => o.id === orderId);
    if (!order) return { data: null, error: { message: "Orden no encontrada." } };
    return {
      data: {
        ...order,
        ticket_number: order.ticket_number || getRepairTicketNumber(order.id, order.branch_id),
      },
      error: null,
    };
  }
  return { data: null, error: null };
}
