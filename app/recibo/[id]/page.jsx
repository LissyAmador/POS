"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReceiptContent from "@/src/components/ReceiptContent";
import { CurrencyProvider } from "@/src/hooks/useCurrency";
import { getSaleById } from "@/src/lib/pos-api";

export default function DigitalReceiptPage({ params }) {
  const [saleId, setSaleId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParams() {
      const resolved = await params;
      setSaleId(resolved.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!saleId) return;

    async function loadReceipt() {
      const result = await getSaleById(saleId);
      if (result.error || !result.sale) {
        setError(result.error?.message || "Recibo no encontrado.");
      } else {
        setData(result);
      }
      setLoading(false);
    }

    loadReceipt();
  }, [saleId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <p className="text-lg font-semibold text-slate-900">Recibo no disponible</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir al POS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-4 flex items-center justify-between print:hidden">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Recibo digital</h1>
              <p className="text-sm text-slate-500">Vista vertical para consulta e impresión</p>
            </div>
            <Link
              href="/dashboard/pos"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Volver al POS
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 print:rounded-none print:p-0 print:shadow-none print:ring-0">
            <ReceiptContent
              sale={data.sale}
              items={data.items}
              tenant={data.tenant}
              branch={data.branch}
              paymentMethod={data.paymentMethod}
              variant="half-letter"
              showActions
            />
          </div>
        </div>
      </div>
    </CurrencyProvider>
  );
}
