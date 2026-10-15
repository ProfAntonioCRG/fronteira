import { normalizeOrders, normalizeSettings, orderTotal, type Extra, type Order, type Product, type Settings } from "./shop";
import { validateTvSlides, type TvSlide } from "./tvMedia";

interface Backup { products: Product[]; extras: Extra[]; orders: Order[]; settings: Settings; tvSlides?: TvSlide[]; }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const money = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const textFields = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === "string");

export function parseBackup(text: string): Backup {
  const value: unknown = JSON.parse(text);
  const invalid = () => { throw new Error("Backup inválido ou incompleto. Selecione um arquivo exportado pelo sistema Fronteira."); };
  if (!record(value) || !Array.isArray(value.products) || !Array.isArray(value.extras) || !Array.isArray(value.orders) || !record(value.settings)) return invalid();
  for (const product of value.products) {
    if (!record(product) || !textFields(product, ["id", "name", "description", "category", "image", "gradient"]) || typeof product.active !== "boolean" || !money(product.price)) invalid();
  }
  const validExtra = (extra: unknown) => record(extra) && textFields(extra, ["id", "name"]) && money(extra.price);
  for (const extra of value.extras) if (!validExtra(extra) || typeof extra.active !== "boolean") invalid();
  for (const order of value.orders) {
    if (!record(order) || !textFields(order, ["id", "customer", "type", "payment", "note"])
      || !Number.isSafeInteger(order.number) || Number(order.number) < 1 || !money(order.createdAt)
      || !["novo", "producao", "pronto", "finalizado", "cancelado"].includes(String(order.status)) || !Array.isArray(order.items) || !order.items.length) return invalid();
    for (const item of order.items) {
      if (!record(item) || !textFields(item, ["uid", "productId", "name", "observation"]) || !money(item.unitPrice)
        || !Number.isSafeInteger(item.qty) || Number(item.qty) < 1 || !Array.isArray(item.extras) || !item.extras.every(validExtra)) invalid();
    }
  }
  const settings = value.settings;
  if (!textFields(settings, ["storeName", "tagline", "phone", "address", "receiptFooter", "panelMessage"])) invalid();
  for (const key of ["soundOnPanel", "voiceOnPanel", "showPanelDate", "showPanelTime"]) {
    if (settings[key] !== undefined && typeof settings[key] !== "boolean") invalid();
  }
  if (settings.receipt !== undefined) {
    if (!record(settings.receipt)) return invalid();
    for (const [key, option] of Object.entries(settings.receipt)) if (key !== "paperWidth" && typeof option !== "boolean") invalid();
  }
  if (settings.whatsapp !== undefined) {
    if (!record(settings.whatsapp)) return invalid();
    if (settings.whatsapp.enabled !== undefined && typeof settings.whatsapp.enabled !== "boolean") invalid();
    for (const key of ["countryCode", "phone", "message", "caption", "size"]) {
      if (settings.whatsapp[key] !== undefined && typeof settings.whatsapp[key] !== "string") invalid();
    }
  }
  const backup = value as unknown as Backup;
  return {
    products: backup.products, extras: backup.extras,
    orders: normalizeOrders(backup.orders).map(order => ({ ...order, total: orderTotal(order.items) })),
    settings: normalizeSettings(backup.settings),
    ...(value.tvSlides !== undefined ? { tvSlides: validateTvSlides(value.tvSlides) } : {}),
  };
}