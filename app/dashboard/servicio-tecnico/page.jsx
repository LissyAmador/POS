"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRepairCatalog,
  getRepairOrders,
  getTechnicians,
  createRepairOrder,
  updateRepairOrderStatus,
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

const emptyForm = {
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
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedParts, setSelectedParts] = useState([]);
  const [partToAdd, setPartToAdd] = useState({ product_id: "", quantity: 1 });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [ticketOrder, setTicketOrder] = useState(null);

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
    setTechnicians(techRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [profile?.tenant_id, branch?.id]);

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  }

  function addPart() {
    if (!partToAdd.product_id) return;
    const product = partsCatalog.find((p) => p.id === partToAdd.product_id);
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

    flash("success", "Orden de reparación registrada.");
    setShowForm(false);
    setForm(emptyForm);
    setSelectedParts([]);
    setTicketOrder(data);
    loadAll();
  }

  async function handleStatusChange(orderId, status) {
    const { error } = await updateRepairOrderStatus(orderId, status);
    if (error) flash("error", error.message);
    else loadAll();
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servicio Técnico</h1>
          <p className="text-sm text-slate-500">
            Recepción de equipos para reparación — {branch?.name}
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Registrar equipo en reparación
          </h2>

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
                Equipo
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Marca *"
                    value={form.device_brand}
                    onChange={(e) => setForm({ ...form, device_brand: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                  <input
                    placeholder="Modelo *"
                    value={form.device_model}
                    onChange={(e) => setForm({ ...form, device_model: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
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
                Reparación
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
                    Repuestos del inventario (opcional)
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={partToAdd.product_id}
                      onChange={(e) =>
                        setPartToAdd({ ...partToAdd, product_id: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Seleccionar repuesto</option>
                      {partsCatalog.map((part) => (
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
              <p className="text-2xl font-bold text-indigo-600">
                {formatMoney(totalCost)}
              </p>
              {selectedService && (
                <p className="text-xs text-slate-400">
                  Mano de obra: {formatMoney(laborCost)}
                  {selectedParts.length > 0 &&
                    ` + repuestos: ${formatMoney(totalCost - laborCost)}`}
                </p>
              )}
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
                  <th className="px-6 py-3 font-medium">Reparación</th>
                  <th className="px-6 py-3 font-medium">Técnico</th>
                  <th className="px-6 py-3 font-medium">Entrega</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = REPAIR_STATUSES[order.status] || REPAIR_STATUSES.recibido;
                  return (
                    <tr key={order.id} className="border-b border-slate-100">
                      <td className="px-6 py-3">
                        <p className="font-mono font-medium">{order.ticket_number}</p>
                        <p className="text-xs text-slate-400">
                          Clave: {order.ticket_password}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium">{order.client_name}</p>
                        <p className="text-xs text-slate-500">{order.client_phone}</p>
                      </td>
                      <td className="px-6 py-3">
                        {order.device_brand} {order.device_model}
                        <p className="text-xs text-slate-500">{order.device_condition}</p>
                      </td>
                      <td className="px-6 py-3">{order.repair_service_name}</td>
                      <td className="px-6 py-3">{order.technician_name}</td>
                      <td className="px-6 py-3 text-xs">
                        {formatRepairDateTime(order.estimated_completion)}
                      </td>
                      <td className="px-6 py-3 font-medium">
                        {formatMoney(order.total_cost)}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                        >
                          {Object.entries(REPAIR_STATUSES).map(([key, val]) => (
                            <option key={key} value={key}>
                              {val.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setTicketOrder(order)}
                          className="text-indigo-600 hover:underline"
                        >
                          Reimprimir
                        </button>
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
    </div>
  );
}
