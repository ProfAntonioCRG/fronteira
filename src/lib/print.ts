import { brl, customerName, itemTotal, pad, normalizeSettings, type Order, type Settings } from "./shop";

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

// Preview and print share this template so the configured content is identical.
export function receiptDocument(order: Order, value: Settings): string {
  const settings = normalizeSettings(value);
  const config = settings.receipt;
  const width = Number(config.paperWidth) - 8;
  const logo = new URL("images/logo.png", document.baseURI).href;
  const rows = order.items.map(item => {
    const extras = config.showExtras && item.extras.length
      ? `<div class="detail">+ ${item.extras.map(extra => `${escape(extra.name)}${config.showPrices ? ` (${escape(brl(extra.price))})` : ""}`).join(", ")}</div>` : "";
    const note = config.showNotes && item.observation ? `<div class="detail note">Obs.: ${escape(item.observation)}</div>` : "";
    return `<div class="item"><div class="row"><span><b>${item.qty}x ${escape(item.name)}</b></span>${config.showPrices ? `<b class="amount">${escape(brl(itemTotal(item)))}</b>` : ""}</div>${extras}${note}</div>`;
  }).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cupom ${pad(order.number)} - ${escape(order.customer)}</title>
  <style>
    @page { size: auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body { font-family: "Courier New", monospace; font-size: 12px; width: ${width}mm; max-width: 100%; margin: 12px auto; padding: 0; color: #000; background: white; overflow-wrap: anywhere; }
    h1,h2,p { margin: 4px 0; text-align: center; }
    h1 { font-size: 21px; } h2 { font-size: 44px; line-height: 1.1; }
    .logo { display: block; width: 64px; height: 64px; object-fit: contain; margin: 0 auto 8px; border-radius: 50%; }
    .line { border-top: 1px dashed #000; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
    .amount { white-space: nowrap; }
    .item { break-inside: avoid; margin: 9px 0; }
    .detail { font-size: 11px; margin: 3px 0 0 12px; }
    .note { font-style: italic; white-space: pre-wrap; }
    .small { font-size: 10px; }
    .total { font-size: 17px; font-weight: bold; }
    .footer { white-space: pre-wrap; }
    @media print { body { margin: 0 auto; } }
  </style></head><body>
    ${config.showLogo ? `<img class="logo" src="${escape(logo)}" alt="Logo da loja">` : ""}
    <h1>${escape(settings.storeName)}</h1>
    <p>${escape(settings.tagline)}</p>
    ${config.showAddress && settings.address ? `<p class="small">${escape(settings.address)}</p>` : ""}
    ${config.showPhone && settings.phone ? `<p class="small">${escape(settings.phone)}</p>` : ""}
    <div class="line"></div>
    <p>PEDIDO</p><h2>Nº ${pad(order.number)}</h2>
    ${config.showCustomer ? `<p><b>${escape(customerName(order.customer))}</b></p>` : ""}
    ${config.showDateTime ? `<p class="small">${escape(new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }))}</p>` : ""}
    ${config.showOrderType ? `<p class="small">${escape(order.type)}</p>` : ""}
    ${config.showPayment ? `<p class="small">Pagamento: ${escape(order.payment)}</p>` : ""}
    <div class="line"></div>${rows}
    ${config.showNotes && order.note ? `<div class="note"><b>Obs. do pedido:</b> ${escape(order.note)}</div>` : ""}
    ${config.showPrices ? `<div class="line"></div><div class="row total"><span>TOTAL</span><span class="amount">${escape(brl(order.total))}</span></div>` : ""}
    <div class="line"></div>
    ${config.showFooter && settings.receiptFooter ? `<p class="footer">${escape(settings.receiptFooter)}</p>` : ""}
    <p class="small">Aguarde seu número e nome no painel.</p>
    <p class="small">COMPROVANTE DE PEDIDO - NÃO FISCAL</p>
    <div style="height:10mm"></div>
  </body></html>`;
}

export function printOrder(order: Order, settings: Settings) {
  const popup = window.open("", "_blank", "width=440,height=720");
  if (!popup) {
    alert("Não foi possível abrir a impressão. Permita pop-ups neste site e tente imprimir o cupom novamente.");
    return;
  }
  popup.opener = null;
  let printed = false;
  const print = () => {
    if (printed || popup.closed) return;
    printed = true;
    setTimeout(() => { if (!popup.closed) { popup.focus(); popup.print(); } }, 200);
  };
  popup.document.open();
  popup.addEventListener("load", print, { once: true });
  popup.document.write(receiptDocument(order, settings));
  popup.document.close();
  if (popup.document.readyState === "complete") print();
}
