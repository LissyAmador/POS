"use client";

import { useEffect } from "react";
import ReceiptContent from "@/src/components/ReceiptContent";
import { openDigitalReceipt } from "@/src/lib/print-receipt";

export default function Receipt({
  sale,
  items,
  tenant,
  branch,
  paymentMethod,
  onClose,
}) {
  useEffect(() => {
    openDigitalReceipt(sale.id);
  }, [sale.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <h2 className="text-base font-semibold text-slate-900">Recibo generado</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Venta completada
          </span>
        </div>

        <div className="px-6 py-4">
          <ReceiptContent
            sale={sale}
            items={items}
            tenant={tenant}
            branch={branch}
            paymentMethod={paymentMethod}
            variant="screen"
          />
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  );
}
