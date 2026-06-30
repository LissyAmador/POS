"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRepairCatalog,
  getRepairOrders,
  getTechnicians,
  createRepairOrder,
  updateRepairOrderStatus,
  findRepairOrder,
  deliverRepairOrder,
  getRepairReceipt,
  getPartsForBrandModel,
  getModelsForBrand,
} from "@/src/lib/repair-api";
import {
  DEVICE_CONDITIONS,
  REPAIR_STATUSES,
  calculateRepairTotal,
  formatRepairDateTime,
} from "@/src/lib/repair-utils";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useBranch } from "@/src/hooks/useBranchContext";
import { useCurrency } from "@/src/hooks/useCurrency";
import RepairTicket from "@/src/components/RepairTicket";
import ReceiptModal from "@/src/components/ReceiptModal";

const emptyForm = {
  ticket_number: "",
  client_name: "",
  client_phone: "",
  device_brand: "",
  device_model: "",
  device_condition: "",
  condition_notes: "",
  repair_service_id: "",
  technician_id: "",
  estimated_completion: "",
  notes: "",
};

export default function ServicioTecnicoPage() {
  const { profile, tenant } = useUserProfile();
  const { activeBranch: branch } = useBranch();
  const { formatMoney } = useCurrency();

  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [partsCatalog, setPartsCatalog] = useState([]);
  const [brandCatalog, setBrandCatalog] = useState({});
  const [brands, setBrands] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedParts, setSelectedParts] = useState([]);
  const [partToAdd, setPartToAdd] = useState({ product_id: "", quantity: 1 });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [ticketOrder, setTicketOrder] = useState(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [viewOrder, setViewOrder] = useState(null);
  const [searching, setSearching] = useState(false);
  const [deliverModal, setDeliverModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [receiptData, setReceiptData] = useState(null);
  const [delivering, setDelivering] = useState(false);

  const models = useMemo(
    () => getModelsForBrand(brandCatalog, form.device_brand),
    [brandCatalog, form.device_brand]
  );

  const compatibleParts = useMemo(
    () => getPartsForBrandModel(partsCatalog, form.device_brand, form.device_model),
    [partsCatalog, form.device_brand, form.device_model]
  );

  const selectedService = services.find((s) => s.id === form.repair_service_id);
  const laborCost = selectedService?.price || 0;

  const totalCost = useMemo(
    () => calculateRepairTotal(laborCost, selectedParts),
    [laborCost, selectedParts]
  );

  async function loadAll() {
    if (!profile?.tenant_id || !branch?.id) return;
    setLoading(true);

    const [ordersRes, catalogRes, techRes] = await Promise.all([
      getRepairOrders(branch.id),
      getRepairCatalog(profile.tenant_id, branch.id),
      getTechnicians(profile.tenant_id, branch.id),
    ]);

    setOrders(ordersRes.data || []);
    setServices(catalogRes.data?.services || []);
    setPartsCatalog(catalogRes.data?.parts || []);
    setBrandCatalog(catalogRes.data?.brandCatalog || {});
    setBrands(catalogRes.data?.brands || []);
    setTechnicians(techRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [profile?.tenant_id, branch?.id]);

  useEffect(() => {
    setSelectedParts([]);
    setPartToAdd({ product_id: "", quantity: 1 });
  }, [form.device_brand, form.device_model]);

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  }

  async function handleSearchTicket(e) {
    e?.preventDefault();
    if (!ticketSearch.trim()) return;
    setSearching(true);
    const { data, error } = await findRepairOrder(branch.id, ticketSearch);
    setSearching(false);
    if (error) return flash("error", error.message);
    setViewOrder(data);
    flash("success", `Ticket ${data.ticket_number} encontrado.`);
  }

  function addPart() {
    if (!partToAdd.product_id) return;
    const product = compatibleParts.find((p) => p.id === partToAdd.product_id);
    if (!product) return;

    const qty = Math.max(1, Number(partToAdd.quantity) || 1);
    if (qty > product.stock) {
      flash("error", `Stock disponible: ${product.stock}`);
      return;
    }

    setSelectedParts((prev) => {
      const existing = prev.find((p) => p.product_id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.product_id === product.id
            ? { ...p, quantity: p.quantity + qty }
            : p
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: qty,
        },
      ];
    });
    setPartToAdd({ product_id: "", quantity: 1 });
  }

  function removePart(productId) {
    setSelectedParts((prev) => prev.filter((p) => p.product_id !== productId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const technician = technicians.find((t) => t.id === form.technician_id);

    const { data, error } = await createRepairOrder({
      tenantId: profile.tenant_id,
      branchId: branch.id,
      userId: profile.user_id,
      ticketNumber: form.ticket_number,
      clientName: form.client_name,
      clientPhone: form.client_phone,
      deviceBrand: form.device_brand,
      deviceModel: form.device_model,
      deviceCondition: form.device_condition,
      conditionNotes: form.condition_notes,
      repairServiceId: form.repair_service_id,
      repairServiceName: selectedService?.name || "",
      laborCost,
      parts: selectedParts,
      technicianId: form.technician_id,
      technicianName: technician?.name || "",
      estimatedCompletion: form.estimated_completion,
      notes: form.notes,
    });

    setSaving(false);

    if (error) {
      flash("error", error.message);
      return;
    }

    flash("success", `Orden registrada — Ticket ${data.ticket_number}`);
    setShowForm(false);
    setForm(emptyForm);
    setSelectedParts([]);
    setViewOrder(data);
    setTicketOrder(data);
    loadAll();
  }

  async function handleStatusChange(order, newStatus) {
    if (newStatus === "entregado") {
      if (order.status === "entregado" && order.sale_id) {
        const { data, error } = await getRepairReceipt(order.id);
        if (error) flash("error", error.message);
        else setReceiptData(data);
        return;
      }
      setDeliverModal(order);
      setPaymentMethod("efectivo");
      return;
    }

    const { error } = await updateRepairOrderStatus(order.id, newStatus, profile.user_id);
    if (error) flash("error", error.message);
    else {
      loadAll();
      if (viewOrder?.id === order.id) {
        setViewOrder({ ...viewOrder, status: newStatus });
      }
    }
  }

  async function confirmDelivery() {
    if (!deliverModal) return;
    setDelivering(true);
    const { data, error } = await deliverRepairOrder({
      orderId: deliverModal.id,
      userId: profile.user_id,
      paymentMethod,
    });
    setDelivering(false);

    if (error) {
      flash("error", error.message);
      return;
    }

    setDeliverModal(null);
    setViewOrder(data.order);
    setReceiptData(data);
    flash("success", "Equipo entregado. Recibo generado e inventario actualizado.");
    loadAll();
  }

  function selectOrder(order) {
    setViewOrder(order);
    setTicketSearch(order.ticket_number);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servicio Técnico</h1>
          <p className="text-sm text-slate-500">
            Recepción y entrega de equipos — {branch?.name}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setForm(emptyForm);
            setSelectedParts([]);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Nueva reparación
        </button>
      </header>

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

      {/* Buscar ticket */}
      <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold text-slate-900">Buscar ticket</h2>
        <form onSubmit={handleSearchTicket} className="flex flex-wrap gap-3">
          <input
            placeholder="Número de ticket o contraseña de retiro"
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            className="min-w-[240px] flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-mono"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </section>

      {/* Detalle del ticket seleccionado */}
      {viewOrder && (
        <section className="mb-6 overflow-hidden rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-600 px-6 py-4 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  Ticket de servicio
                </p>
                <p className="font-mono text-3xl font-bold">{viewOrder.ticket_number}</p>
                <p className="mt-1 text-sm text-indigo-100">
                  Contraseña:{" "}
                  <span className="font-mono text-lg font-bold tracking-widest">
                    {viewOrder.ticket_password}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    REPAIR_STATUSES[viewOrder.status]?.color || "bg-white/20"
                  }`}
                >
                  {REPAIR_STATUSES[viewOrder.status]?.label || viewOrder.status}
                </span>
                <p className="mt-2 text-2xl font-bold">{formatMoney(viewOrder.total_cost)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Cliente</p>
              <p className="font-medium">{viewOrder.client_name}</p>
              <p className="text-sm text-slate-500">{viewOrder.client_phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Equipo</p>
              <p className="font-medium">
                {viewOrder.device_brand} {viewOrder.device_model}
              </p>
              <p className="text-sm text-slate-500">{viewOrder.device_condition}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Reparación</p>
              <p className="font-medium">{viewOrder.repair_service_name}</p>
              <p className="text-sm text-slate-500">Téc: {viewOrder.technician_name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Entrega estimada</p>
              <p className="font-medium">
                {formatRepairDateTime(viewOrder.estimated_completion)}
              </p>
            </div>
          </div>

          {viewOrder.parts?.length > 0 && (
            <div className="border-t border-indigo-100 px-6 py-4">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Repuestos</p>
              <div className="flex flex-wrap gap-2">
                {viewOrder.parts.map((part) => (
                  <span
                    key={part.product_id}
                    className="rounded-lg bg-white px-3 py-1 text-sm ring-1 ring-slate-200"
                  >
                    {part.product_name} x{part.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-indigo-100 bg-slate-50 px-6 py-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-600">Estado:</span>
              <select
                value={viewOrder.status}
                onChange={(e) => handleStatusChange(viewOrder, e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                {Object.entries(REPAIR_STATUSES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setTicketOrder(viewOrder)}
              className="rounded-lg border border-indigo-300 bg-white px-4 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
            >
              Imprimir ticket térmico
            </button>
            {viewOrder.sale_id && (
              <button
                onClick={async () => {
                  const { data, error } = await getRepairReceipt(viewOrder.id);
                  if (error) flash("error", error.message);
                  else setReceiptData(data);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-700"
              >
                Ver recibo de entrega
              </button>
            )}
          </div>
        </section>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Registrar equipo en reparación
          </h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Número de ticket (opcional — se genera automático si se deja vacío)
            </label>
            <input
              placeholder="Ej: ST-02-0042"
              value={form.ticket_number}
              onChange={(e) => setForm({ ...form, ticket_number: e.target.value.toUpperCase() })}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">
                Datos del cliente
              </h3>
              <div className="space-y-3">
                <input
                  placeholder="Nombre del cliente *"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Teléfono *"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">
                Equipo — Marca y modelo
              </h3>
              <div className="space-y-3">
                <select
                  value={form.device_brand}
                  onChange={(e) =>
                    setForm({ ...form, device_brand: e.target.value, device_model: "" })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar marca *</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <select
                  value={form.device_model}
                  onChange={(e) => setForm({ ...form, device_model: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                  disabled={!form.device_brand}
                >
                  <option value="">Seleccionar modelo *</option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <select
                  value={form.device_condition}
                  onChange={(e) =>
                    setForm({ ...form, device_condition: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Estado del teléfono *</option>
                  {DEVICE_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Detalle adicional del estado"
                  value={form.condition_notes}
                  onChange={(e) =>
                    setForm({ ...form, condition_notes: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">
                Reparación y repuestos
              </h3>
              <div className="space-y-3">
                <select
                  value={form.repair_service_id}
                  onChange={(e) =>
                    setForm({ ...form, repair_service_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Tipo de reparación *</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {formatMoney(service.price)}
                    </option>
                  ))}
                </select>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Repuestos para {form.device_brand} {form.device_model || "—"}
                  </p>
                  {!form.device_brand || !form.device_model ? (
                    <p className="text-xs text-slate-400">
                      Seleccione marca y modelo para ver repuestos compatibles.
                    </p>
                  ) : compatibleParts.length === 0 ? (
                    <p className="text-xs text-amber-600">
                      No hay repuestos en inventario para este modelo.
                    </p>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <select
                          value={partToAdd.product_id}
                          onChange={(e) =>
                            setPartToAdd({ ...partToAdd, product_id: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          <option value="">Seleccionar repuesto</option>
                          {compatibleParts.map((part) => (
                            <option key={part.id} value={part.id}>
                              {part.name} (stock: {part.stock}) — {formatMoney(part.price)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={partToAdd.quantity}
                          onChange={(e) =>
                            setPartToAdd({ ...partToAdd, quantity: e.target.value })
                          }
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={addPart}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white"
                        >
                          +
                        </button>
                      </div>
                      {selectedParts.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {selectedParts.map((part) => (
                            <li
                              key={part.product_id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {part.product_name} x{part.quantity}
                              </span>
                              <div className="flex items-center gap-2">
                                <span>{formatMoney(part.price * part.quantity)}</span>
                                <button
                                  type="button"
                                  onClick={() => removePart(part.product_id)}
                                  className="text-red-500"
                                >
                                  ✕
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">
                Asignación y entrega
              </h3>
              <div className="space-y-3">
                <select
                  value={form.technician_id}
                  onChange={(e) =>
                    setForm({ ...form, technician_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Técnico asignado *</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    Fecha y hora estimada de entrega *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.estimated_completion}
                    onChange={(e) =>
                      setForm({ ...form, estimated_completion: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <textarea
                  placeholder="Notas internas"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div>
              <p className="text-sm text-slate-500">Costo total estimado</p>
              <p className="text-2xl font-bold text-indigo-600">{formatMoney(totalCost)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Registrar y generar ticket"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Órdenes en {branch?.name}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            No hay órdenes de reparación registradas en esta sucursal.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500">
                  <th className="px-6 py-3 font-medium">Ticket</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Equipo</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = REPAIR_STATUSES[order.status] || REPAIR_STATUSES.recibido;
                  const isSelected = viewOrder?.id === order.id;
                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-slate-100 ${isSelected ? "bg-indigo-50" : ""}`}
                    >
                      <td className="px-6 py-3">
                        <button
                          onClick={() => selectOrder(order)}
                          className="text-left font-mono font-medium text-indigo-600 hover:underline"
                        >
                          {order.ticket_number}
                        </button>
                        <p className="text-xs text-slate-400">Clave: {order.ticket_password}</p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium">{order.client_name}</p>
                        <p className="text-xs text-slate-500">{order.client_phone}</p>
                      </td>
                      <td className="px-6 py-3">
                        {order.device_brand} {order.device_model}
                      </td>
                      <td className="px-6 py-3 font-medium">{formatMoney(order.total_cost)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => selectOrder(order)}
                            className="text-indigo-600 hover:underline"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => setTicketOrder(order)}
                            className="text-slate-600 hover:underline"
                          >
                            Ticket
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ticketOrder && (
        <RepairTicket
          order={ticketOrder}
          tenant={tenant}
          branch={branch}
          onClose={() => setTicketOrder(null)}
        />
      )}

      {deliverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Entregar equipo</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ticket <span className="font-mono font-semibold">{deliverModal.ticket_number}</span>{" "}
              — se generará recibo y se descontarán los repuestos del inventario.
            </p>
            <p className="mt-3 text-xl font-bold text-indigo-600">
              Total: {formatMoney(deliverModal.total_cost)}
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Método de pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmDelivery}
                disabled={delivering}
                className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {delivering ? "Procesando..." : "Confirmar entrega y generar recibo"}
              </button>
              <button
                onClick={() => setDeliverModal(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptData?.sale && (
        <ReceiptModal
          sale={receiptData.sale}
          items={receiptData.items}
          tenant={tenant}
          branch={branch}
          paymentMethod={receiptData.sale.payment_method}
          title="Recibo de entrega — Servicio Técnico"
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
