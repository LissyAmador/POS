import {
  calculateSubtotal,
  escapeHtml,
  formatReceiptDate,
  formatReceiptDateShort,
  getItemName,
  getReceiptNumber,
} from "./receipt-utils";

function buildItemsRows(items, formatMoney, compact = false) {
  return items
    .map((item) => {
      const name = escapeHtml(getItemName(item));
      const qty = item.quantity;
      const unit = formatMoney(Number(item.price));
      const line = formatMoney(Number(item.price) * qty);

      if (compact) {
        return `
          <tr>
            <td class="desc">${name}</td>
            <td class="qty">${qty}</td>
            <td class="amt">${line}</td>
          </tr>
          <tr class="unit-row">
            <td colspan="3" class="unit">${unit} c/u</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>${name}</td>
          <td class="center">${qty}</td>
          <td class="right">${unit}</td>
          <td class="right">${line}</td>
        </tr>
      `;
    })
    .join("");
}

function buildReceiptBody({
  format,
  sale,
  items,
  tenant,
  branch,
  formatMoney,
  qrDataUrl,
  paymentMethod,
}) {
  const subtotal = calculateSubtotal(items);
  const receiptNo = getReceiptNumber(sale.id);
  const isThermal = format === "thermal";
  const paymentLabel =
    sale.type === "contado"
      ? paymentMethod || "efectivo"
      : sale.type === "credito"
        ? "crédito"
        : sale.type;

  const clientBlock = sale.client_name
    ? `<p><strong>Cliente:</strong> ${escapeHtml(sale.client_name)}</p>`
    : "";

  const creditBlock =
    sale.type === "credito" && sale.due_date
      ? `<p class="credit"><strong>Vencimiento:</strong> ${escapeHtml(formatReceiptDateShort(sale.due_date))}</p>`
      : "";

  const itemsHeader = isThermal
    ? `<thead><tr><th>Descripción</th><th>Cant</th><th>Importe</th></tr></thead>`
    : `<thead><tr><th>Descripción</th><th>Cant.</th><th>P. unit.</th><th>Importe</th></tr></thead>`;

  const styles =
    format === "thermal"
      ? `
        @page { size: 80mm auto; margin: 4mm; }
        * { box-sizing: border-box; }
        body {
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          line-height: 1.35;
          color: #000;
          width: 72mm;
          margin: 0 auto;
          padding: 0;
        }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .header h1 { font-size: 14px; margin: 0 0 4px; }
        .header p { margin: 2px 0; }
        .meta { margin-bottom: 8px; }
        .meta p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { padding: 3px 0; vertical-align: top; }
        th { border-bottom: 1px solid #000; text-align: left; font-size: 10px; }
        .desc { width: 55%; word-break: break-word; }
        .qty { width: 15%; text-align: center; }
        .amt { width: 30%; text-align: right; }
        .unit-row td.unit { font-size: 9px; color: #444; padding-bottom: 4px; border-bottom: 1px dotted #ccc; }
        .totals { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
        .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
        .totals .total { font-size: 14px; font-weight: bold; margin-top: 6px; }
        .qr { text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; }
        .qr img { width: 96px; height: 96px; }
        .footer { text-align: center; font-size: 9px; margin-top: 8px; }
        .credit { color: #92400e; }
      `
      : `
        @page { size: 5.5in 8.5in portrait; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.45;
          color: #111;
          max-width: 5.5in;
          margin: 0 auto;
          padding: 0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #111;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .header h1 { font-size: 20px; margin: 0 0 6px; }
        .header h2 { font-size: 13px; font-weight: normal; margin: 0; color: #444; }
        .header p { margin: 4px 0; color: #555; }
        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          margin-bottom: 16px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 6px;
        }
        .meta p { margin: 0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; }
        .center { text-align: center; }
        .right { text-align: right; }
        .totals { margin-top: 16px; padding-top: 12px; border-top: 2px solid #111; }
        .totals div { display: flex; justify-content: space-between; margin: 6px 0; }
        .totals .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
        .qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #cbd5e1;
        }
        .qr img { width: 140px; height: 140px; }
        .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 16px; }
        .credit { color: #b45309; font-weight: 600; }
      `;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo ${receiptNo}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(tenant?.name || "POS SaaS")}</h1>
    <h2>${escapeHtml(branch?.name || "Sucursal")}</h2>
    ${branch?.address ? `<p>${escapeHtml(branch.address)}</p>` : ""}
    <p><strong>RECIBO DE VENTA</strong></p>
    <p>No. ${receiptNo}</p>
    <p>${escapeHtml(formatReceiptDate(sale.created_at))}</p>
  </div>

  <div class="meta">
    ${clientBlock}
    <p><strong>Tipo:</strong> ${escapeHtml(sale.type)}</p>
    <p><strong>Pago:</strong> ${escapeHtml(paymentLabel)}</p>
    ${creditBlock}
  </div>

  <table>
    ${itemsHeader}
    <tbody>
      ${buildItemsRows(items, formatMoney, isThermal)}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${escapeHtml(formatMoney(subtotal))}</span></div>
    <div class="total"><span>TOTAL</span><span>${escapeHtml(formatMoney(sale.total))}</span></div>
  </div>

  <div class="qr">
    ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Código QR del recibo" />` : ""}
    <p>Escanee para ver el recibo digital</p>
    <p>https://pos-saas-black.vercel.app/recibo/${escapeHtml(sale.id)}</p>
  </div>

  <div class="footer">
    <p>Gracias por su compra</p>
    <p>Documento generado por POS SaaS</p>
  </div>
</body>
</html>`;
}

export function printReceiptDocument({
  format,
  sale,
  items,
  tenant,
  branch,
  formatMoney,
  qrDataUrl,
  paymentMethod,
}) {
  const html = buildReceiptBody({
    format,
    sale,
    items,
    tenant,
    branch,
    formatMoney,
    qrDataUrl,
    paymentMethod,
  });

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("Permita ventanas emergentes para imprimir el recibo.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}

export function openDigitalReceipt(saleId) {
  const url = `/recibo/${saleId}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
