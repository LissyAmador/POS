export const DEVICE_CONDITIONS = [
  "Pantalla rota",
  "No enciende",
  "Batería hinchada / no carga",
  "Puerto de carga dañado",
  "Sin señal / antena",
  "Cámara no funciona",
  "Altavoz / micrófono dañado",
  "Daño por líquido",
  "Software / bloqueo",
  "Otro (ver notas)",
];

export const REPAIR_STATUSES = {
  recibido: { label: "Recibido", color: "bg-blue-100 text-blue-700" },
  en_proceso: { label: "En proceso", color: "bg-amber-100 text-amber-700" },
  listo: { label: "Listo", color: "bg-emerald-100 text-emerald-700" },
  entregado: { label: "Entregado", color: "bg-slate-100 text-slate-600" },
};

export function generateTicketPassword() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function getRepairTicketNumber(orderId, branchId) {
  const branchCode = branchId?.slice(-2) || "00";
  const seq = orderId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `ST-${branchCode}-${seq}`;
}

export function formatRepairDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateRepairTotal(repairServicePrice, parts = []) {
  const labor = Number(repairServicePrice) || 0;
  const partsTotal = parts.reduce(
    (sum, part) => sum + Number(part.price) * Number(part.quantity),
    0
  );
  return labor + partsTotal;
}
