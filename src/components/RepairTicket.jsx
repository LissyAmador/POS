"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { triggerNativePrint } from "@/src/lib/print-receipt";
import { formatRepairDateTime } from "@/src/lib/repair-utils";
import { useCurrency } from "@/src/hooks/useCurrency";

function RepairTicketBody({ order, tenant, branch, formatMoney }) {
  return (
    <div className="mx-auto w-full max-w-[80mm] font-mono text-[11px] leading-snug text-black">
      <div className="border-b border-dashed border-slate-400 pb-3 text-center">
        <h2 className="text-sm font-bold">{tenant?.name || "POS SaaS"}</h2>
        <p className="text-[10px] text-slate-600">{branch?.name}</p>
        {branch?.address && (
          <p className="text-[10px] text-slate-500">{branch.address}</p>
        )}
        <p className="mt-2 text-[11px] font-bold">SERVICIO TÉCNICO</p>
        <p className="text-[10px] text-slate-500">Ticket: {order.ticket_number}</p>
        <p className="text-[10px] text-slate-500">
          {formatRepairDateTime(order.created_at)}
        </p>
      </div>

      <div className="my-3 rounded border-2 border-dashed border-slate-800 py-3 text-center">
        <p className="text-[10px] uppercase text-slate-500">Contraseña de retiro</p>
        <p className="text-2xl font-bold tracking-[0.3em]">{order.ticket_password}</p>
      </div>

      <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
        <p>
          <span className="text-slate-500">Cliente: </span>
          {order.client_name}
        </p>
        <p>
          <span className="text-slate-500">Tel: </span>
          {order.client_phone}
        </p>
      </div>

      <div className="mt-3 space-y-1 border-b border-dashed border-slate-300 pb-3">
        <p className="font-semibold">Equipo</p>
        <p>
          {order.device_brand} {order.device_model}
        </p>
        <p>
          <span className="text-slate-500">Estado: </span>
          {order.device_condition}
        </p>
        {order.condition_notes && (
          <p className="text-[10px] text-slate-600">{order.condition_notes}</p>
        )}
      </div>

      <div className="mt-3 space-y-1 border-b border-dashed border-slate-300 pb-3">
        <p className="font-semibold">Reparación</p>
        <p>{order.repair_service_name}</p>
        <p>
          <span className="text-slate-500">Mano de obra: </span>
          {formatMoney(order.labor_cost)}
        </p>
      </div>

      {order.parts?.length > 0 && (
        <div className="mt-3 border-b border-dashed border-slate-300 pb-3">
          <p className="mb-1 font-semibold">Repuestos</p>
          {order.parts.map((part) => (
            <div key={part.product_id} className="flex justify-between text-[10px]">
              <span>
                {part.product_name} x{part.quantity}
              </span>
              <span>{formatMoney(part.price * part.quantity)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1 border-b border-dashed border-slate-300 pb-3">
        <p>
          <span className="text-slate-500">Técnico: </span>
          {order.technician_name}
        </p>
        <p>
          <span className="text-slate-500">Entrega est.: </span>
          {formatRepairDateTime(order.estimated_completion)}
        </p>
        {order.notes && (
          <p className="text-[10px] text-slate-600">
            <span className="text-slate-500">Notas: </span>
            {order.notes}
          </p>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] uppercase text-slate-500">Total reparación</p>
        <p className="text-lg font-bold">{formatMoney(order.total_cost)}</p>
      </div>

      <p className="mt-4 text-center text-[9px] text-slate-500">
        Conserve este ticket y su contraseña para retirar su equipo.
      </p>
    </div>
  );
}

export default function RepairTicket({ order, tenant, branch, onClose }) {
  const { formatMoney } = useCurrency();
  const printRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handlePrint() {
    triggerNativePrint("thermal");
  }

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Ticket de reparación</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <RepairTicketBody
            order={order}
            tenant={tenant}
            branch={branch}
            formatMoney={formatMoney}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Imprimir ticket térmico
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
          >
            Listo
          </button>
        </div>

        {mounted &&
          createPortal(
            <div
              id="print-receipt-root"
              ref={printRef}
              className="hidden print:block"
            >
              <RepairTicketBody
                order={order}
                tenant={tenant}
                branch={branch}
                formatMoney={formatMoney}
              />
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
