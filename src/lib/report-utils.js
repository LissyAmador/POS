export const PAYMENT_METHODS = [
  { value: "all", label: "Todos los métodos" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "credito", label: "Crédito" },
];

export const PAYMENT_LABELS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  credito: "Crédito",
};

export function getPaymentLabel(sale) {
  if (sale.type === "credito") return "Crédito";
  return PAYMENT_LABELS[sale.payment_method] || sale.payment_method || "Efectivo";
}

export function getDefaultDateRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstDay.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
  };
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
