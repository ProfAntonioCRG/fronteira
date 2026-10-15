import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTvMedia, type TvSlide } from "./tvMedia";
import { DEFAULT_WHATSAPP, normalizeWhatsApp, type WhatsAppSettings } from "./whatsapp";
import { openTvWindow, sendToWindows, subscribeWindows } from "./windowSync";
import { usePanelLink } from "./usePanelLink";

export type OrderStatus = "novo" | "producao" | "pronto" | "finalizado" | "cancelado";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  image: string;
  gradient: string;
  tag?: string;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface OrderItemExtra { id: string; name: string; price: number; }

export interface OrderItem {
  uid: string;
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  extras: OrderItemExtra[];
  observation: string;
}

export interface Order {
  id: string;
  number: number;
  customer: string;
  type: string;
  payment: string;
  items: OrderItem[];
  note: string;
  total: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  readyAt?: number;
  calledAt?: number;
  callCount: number;
  finishedAt?: number;
}

export interface ReceiptSettings {
  paperWidth: "58" | "80";
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showCustomer: boolean;
  showDateTime: boolean;
  showOrderType: boolean;
  showPayment: boolean;
  showExtras: boolean;
  showNotes: boolean;
  showPrices: boolean;
  showFooter: boolean;
}

export interface Settings {
  storeName: string;
  tagline: string;
  phone: string;
  address: string;
  receiptFooter: string;
  panelMessage: string;
  nextNumber: number;
  slideSeconds: number;
  soundOnPanel: boolean;
  voiceOnPanel: boolean;
  showPanelDate: boolean;
  showPanelTime: boolean;
  slideOrder: "sequence" | "shuffle";
  slideFit: "contain" | "cover";
  receipt: ReceiptSettings;
  whatsapp: WhatsAppSettings;
}

export interface LastCall { orderId: string; number: number; customer: string; at: number; }

const K = {
  products: "fronteira_products_v1",
  extras: "fronteira_extras_v1",
  orders: "fronteira_orders_v1",
  settings: "fronteira_settings_v1",
  lastCall: "fronteira_lastcall_v1",
};

export const CATEGORIES = ["Açaí", "Combos", "Doces", "Bebidas"];

const IMG = {
  acai1: "https://images.pexels.com/photos/5232938/pexels-photo-5232938.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  acai2: "https://images.pexels.com/photos/5323036/pexels-photo-5323036.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  acai3: "https://images.pexels.com/photos/9102652/pexels-photo-9102652.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  brownie: "https://images.pexels.com/photos/33312981/pexels-photo-33312981.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  brownie2: "https://images.pexels.com/photos/33312980/pexels-photo-33312980.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  cake: "https://images.pexels.com/photos/5702854/pexels-photo-5702854.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

export const DEFAULT_PRODUCTS: Product[] = [
  { id: "p1", name: "Açaí 300ml", description: "Açaí puro e cremoso no copo de 300ml. Monte do seu jeito!", price: 14.9, category: "Açaí", active: true, image: IMG.acai1, gradient: "from-violet-700 via-purple-800 to-fuchsia-950", tag: "Mais pedido" },
  { id: "p2", name: "Açaí 500ml", description: "O queridinho da casa no copo de 500ml, bem servido.", price: 19.9, category: "Açaí", active: true, image: IMG.acai2, gradient: "from-purple-700 via-fuchsia-900 to-purple-950", tag: "Mais pedido" },
  { id: "p3", name: "Açaí 700ml", description: "Pra quem tem fome de açaí de verdade. Copo de 700ml.", price: 24.9, category: "Açaí", active: true, image: IMG.acai3, gradient: "from-indigo-700 via-purple-900 to-black" },
  { id: "p4", name: "Açaí Tentação", description: "Açaí 500ml com morango fresco, leite ninho e leite condensado.", price: 26.9, category: "Açaí", active: true, image: IMG.acai2, gradient: "from-pink-700 via-purple-800 to-purple-950", tag: "Especial" },
  { id: "p5", name: "Açaí Nutella Suprema", description: "Açaí 500ml com Nutella, morango, bis e chantilly.", price: 28.9, category: "Açaí", active: true, image: IMG.acai1, gradient: "from-amber-800 via-purple-900 to-purple-950", tag: "Especial" },
  { id: "p6", name: "Açaí Banana & Granola", description: "Açaí 500ml com banana, granola crocante e mel.", price: 21.9, category: "Açaí", active: true, image: IMG.acai3, gradient: "from-yellow-600 via-purple-800 to-purple-950" },
  { id: "p7", name: "Tigela Fronteira Especial", description: "Nossa tigela assinatura: açaí, frutas da estação, ninho, Nutella e granola.", price: 32.9, category: "Açaí", active: true, image: IMG.acai3, gradient: "from-fuchsia-700 via-purple-900 to-black", tag: "Da casa" },
  { id: "p8", name: "Combo Casal", description: "2 açaís de 500ml montados + 4 adicionais à escolha.", price: 36.9, category: "Combos", active: true, image: IMG.acai1, gradient: "from-rose-700 via-purple-900 to-purple-950", tag: "Pra dividir" },
  { id: "p9", name: "Combo Família", description: "3 açaís de 500ml + 1 bolo de pote + 2 bebidas.", price: 54.9, category: "Combos", active: true, image: IMG.acai2, gradient: "from-purple-600 via-indigo-900 to-purple-950" },
  { id: "p10", name: "Brownie Recheado", description: "Brownie de chocolate meio amargo com recheio cremoso.", price: 12.9, category: "Doces", active: true, image: IMG.brownie, gradient: "from-amber-900 via-stone-900 to-black", tag: "Novo" },
  { id: "p11", name: "Bolo de Pote Ninho c/ Morango", description: "Camadas de bolo fofinho, creme de ninho e morangos frescos.", price: 14.9, category: "Doces", active: true, image: IMG.brownie2, gradient: "from-pink-600 via-rose-800 to-purple-950" },
  { id: "p12", name: "Cookie Recheado", description: "Cookie crocante por fora, macio por dentro, recheio de chocolate.", price: 9.9, category: "Doces", active: true, image: IMG.brownie2, gradient: "from-orange-800 via-amber-950 to-black" },
  { id: "p13", name: "Pudim Artesanal", description: "Pudim de leite condensado com calda de caramelo, receita da casa.", price: 11.9, category: "Doces", active: true, image: IMG.cake, gradient: "from-yellow-600 via-amber-800 to-purple-950" },
  { id: "p14", name: "Suco de Açaí c/ Laranja", description: "Suco natural batido na hora, 400ml, super refrescante.", price: 10.9, category: "Bebidas", active: true, image: IMG.acai2, gradient: "from-orange-600 via-purple-800 to-purple-950" },
  { id: "p15", name: "Refrigerante Lata", description: "Lata 350ml geladíssima. Consultar sabores disponíveis.", price: 6.0, category: "Bebidas", active: true, image: "", gradient: "from-red-700 via-rose-900 to-purple-950" },
  { id: "p16", name: "Água Mineral", description: "Garrafa 500ml, com ou sem gás.", price: 4.0, category: "Bebidas", active: true, image: "", gradient: "from-sky-600 via-blue-900 to-purple-950" },
];

export const DEFAULT_EXTRAS: Extra[] = [
  { id: "e1", name: "Leite Ninho", price: 4, active: true },
  { id: "e2", name: "Morango", price: 5, active: true },
  { id: "e3", name: "Banana", price: 3, active: true },
  { id: "e4", name: "Granola", price: 3, active: true },
  { id: "e5", name: "Nutella", price: 6, active: true },
  { id: "e6", name: "Leite Condensado", price: 2.5, active: true },
  { id: "e7", name: "Chantilly", price: 4, active: true },
  { id: "e8", name: "Paçoca", price: 3, active: true },
  { id: "e9", name: "Bis", price: 4, active: true },
  { id: "e10", name: "Ovomaltine", price: 4, active: true },
  { id: "e11", name: "Creme de Avelã", price: 5.5, active: true },
  { id: "e12", name: "Confete", price: 3.5, active: true },
];

export const DEFAULT_RECEIPT: ReceiptSettings = {
  paperWidth: "80",
  showLogo: false,
  showAddress: true,
  showPhone: true,
  showCustomer: true,
  showDateTime: true,
  showOrderType: true,
  showPayment: true,
  showExtras: true,
  showNotes: true,
  showPrices: true,
  showFooter: true,
};

export const DEFAULT_SETTINGS: Settings = {
  storeName: "FRONTEIRA",
  tagline: "Açaí & Doces",
  phone: "(00) 00000-0000",
  address: "Rua Exemplo, 123 - Centro",
  receiptFooter: "Obrigado pela preferência! Volte sempre.",
  panelMessage: "Feito com carinho, pra você!",
  nextNumber: 1,
  slideSeconds: 6,
  soundOnPanel: true,
  voiceOnPanel: true,
  showPanelDate: true,
  showPanelTime: true,
  slideOrder: "sequence",
  slideFit: "contain",
  receipt: DEFAULT_RECEIPT,
  whatsapp: DEFAULT_WHATSAPP,
};

export function normalizeSettings(value: Partial<Settings>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...value, receipt: { ...DEFAULT_RECEIPT, ...value?.receipt } };
  const number = Math.floor(Number(merged.nextNumber));
  return {
    ...merged,
    nextNumber: Number.isSafeInteger(number) ? Math.max(1, number) : 1,
    slideSeconds: Math.min(120, Math.max(2, Math.floor(Number(merged.slideSeconds) || 6))),
    slideOrder: merged.slideOrder === "shuffle" ? "shuffle" : "sequence",
    slideFit: merged.slideFit === "cover" ? "cover" : "contain",
    voiceOnPanel: typeof merged.voiceOnPanel === "boolean" ? merged.voiceOnPanel : true,
    receipt: { ...merged.receipt, paperWidth: merged.receipt.paperWidth === "58" ? "58" : "80" },
    whatsapp: normalizeWhatsApp(value?.whatsapp),
  };
}

export function normalizeOrders(orders: Order[]): Order[] {
  return orders.map(o => ({ ...o, customer: customerName(o.customer), status: o.status === "novo" ? "producao" : o.status, callCount: Number.isSafeInteger(o.callCount) && o.callCount >= 0 ? o.callCount : 0 }));
}

export function customerName(value: unknown): string {
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  return !name || name.toLocaleLowerCase("pt-BR") === "cliente balcão" ? "Cliente" : name;
}

function normalizeProducts(products: Product[]): Product[] {
  return products.map(p => ({
    ...p,
    image: p.image === "images/slide-combo.jpg" || p.image === "images/slide-acai.jpg"
      ? IMG.acai1 : p.image === "images/slide-doces.jpg" ? IMG.brownie : p.image,
  }));
}

const identity = <T,>(value: T) => value;
const EMPTY_ORDERS: Order[] = [];

// Broadcast for immediate updates, storage events + polling for recovery, and an opener bridge for previews.
function useStoredState<T>(key: string, fallback: T, onError: (message: string) => void, normalize: (value: T) => T = identity, authoritative = true) {
  const lastDisk = useRef<string | null>(null);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      lastDisk.current = raw;
      return normalize(raw ? JSON.parse(raw) : fallback);
    } catch { return fallback; }
  });
  const current = useRef(value);
  const serialized = useRef(JSON.stringify(value));
  const set: React.Dispatch<React.SetStateAction<T>> = useCallback(action => {
    const next = normalize(typeof action === "function" ? (action as (prev: T) => T)(current.current) : action);
    const raw = JSON.stringify(next);
    try {
      localStorage.setItem(key, raw);
      lastDisk.current = raw;
    } catch {
      onError("Não foi possível salvar os dados neste navegador. Exporte um backup antes de fechar e verifique o espaço disponível.");
    }
    current.current = next;
    serialized.current = raw;
    setValue(next);
    sendToWindows({ type: "state", key, raw });
  }, [key, normalize, onError]);

  useEffect(() => {
    const receive = (raw: string | null, persist = false) => {
      try {
        const next = normalize(raw ? JSON.parse(raw) : fallback);
        const normalized = JSON.stringify(next);
        if (persist) {
          try {
            if (localStorage.getItem(key) !== normalized) localStorage.setItem(key, normalized);
            lastDisk.current = normalized;
          } catch { onError("A atualização chegou, mas não foi salva. Faça backup antes de fechar o navegador."); }
        }
        if (serialized.current !== normalized) {
          serialized.current = normalized; current.current = next; setValue(next);
        }
      } catch { onError("Não foi possível ler uma atualização de outra janela."); }
    };
    const refresh = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== lastDisk.current) { lastDisk.current = raw; receive(raw); }
      } catch { /* A live bridge can still update a storage-restricted preview. */ }
    };
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) refresh(); };
    const unsubscribe = subscribeWindows(message => {
      if (message.type === "state" && message.key === key && typeof message.raw === "string") receive(message.raw, true);
      if (message.type === "hello" && message.role === "panel" && authoritative) sendToWindows({ type: "state", key, raw: serialized.current });
    });
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh); window.addEventListener("pageshow", refresh);
    const interval = setInterval(refresh, 1500);
    refresh();
    return () => {
      unsubscribe(); clearInterval(interval);
      window.removeEventListener("storage", onStorage); window.removeEventListener("focus", refresh); window.removeEventListener("pageshow", refresh);
    };
  }, [key, fallback, normalize, onError, authoritative]);
  return [value, set, current] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const pad = (n: number) => String(n).padStart(3, "0");
export const itemTotal = (i: OrderItem) => (Math.round(i.unitPrice * 100) + i.extras.reduce((sum, extra) => sum + Math.round(extra.price * 100), 0)) * i.qty / 100;
export const orderTotal = (items: OrderItem[]) => items.reduce((sum, item) => sum + Math.round(itemTotal(item) * 100), 0) / 100;
export function elapsed(ts: number, now: number) {
  const m = Math.max(0, Math.floor((now - ts) / 60000));
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}
export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

interface ShopCtx extends ReturnType<typeof usePanelLink> {
  products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  extras: Extra[]; setExtras: React.Dispatch<React.SetStateAction<Extra[]>>;
  orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  nextNumber: number;
  storageError: string;
  tvSlides: TvSlide[];
  mediaLoaded: boolean;
  mediaError: string;
  saveTvSlides: (slides: TvSlide[]) => Promise<void>;
  lastCall: LastCall | null;
  createOrder: (o: Omit<Order, "id" | "number" | "createdAt" | "updatedAt" | "callCount">) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  callOrder: (o: Order) => Order | null;
  readyAndCall: (o: Order) => Order | null;
  openPanel: () => void;
  panelOpenError: string;
  resetDefaults: () => void;
}

const Ctx = createContext<ShopCtx | null>(null);

export function ShopProvider({ children, isPanel = false }: { children: React.ReactNode; isPanel?: boolean }) {
  const [storageError, setStorageError] = useState("");
  const [panelOpenError, setPanelOpenError] = useState("");
  const [products, setProducts] = useStoredState(K.products, DEFAULT_PRODUCTS, setStorageError, normalizeProducts, !isPanel);
  const [extras, setExtras] = useStoredState(K.extras, DEFAULT_EXTRAS, setStorageError, identity, !isPanel);
  const [orders, setOrders, ordersRef] = useStoredState<Order[]>(K.orders, EMPTY_ORDERS, setStorageError, normalizeOrders, !isPanel);
  const [settings, setSettings] = useStoredState(K.settings, DEFAULT_SETTINGS, setStorageError, normalizeSettings, !isPanel);
  const [lastCall, setLastCall] = useStoredState<LastCall | null>(K.lastCall, null, setStorageError, identity, !isPanel);
  const link = usePanelLink(isPanel);
  const media = useTvMedia();
  const nextNumber = Math.max(settings.nextNumber, orders.reduce((maximum, order) => Math.max(maximum, order.number + 1), 1));
  const numberRef = useRef(nextNumber);
  numberRef.current = nextNumber;
  const callTime = useRef(lastCall?.at || 0);
  callTime.current = Math.max(callTime.current, lastCall?.at || 0);

  const openPanel = useCallback(() => {
    setPanelOpenError(openTvWindow() ? "" : "Não foi possível abrir a TV. Permita pop-ups neste site e use o aplicativo pelo endereço local ou publicado, não por arquivo HTML.");
  }, []);

  const stampCall = useCallback((order: Order): Order => {
    const at = Math.max(Date.now(), callTime.current + 1);
    callTime.current = at;
    return {
      ...order, customer: customerName(order.customer), status: "pronto", readyAt: order.readyAt || at,
      finishedAt: undefined, calledAt: at, updatedAt: at, callCount: (order.status === "pronto" ? order.callCount : 0) + 1,
    };
  }, []);

  const recordCall = useCallback((order: Order) => {
    setLastCall({ orderId: order.id, number: order.number, customer: customerName(order.customer), at: order.calledAt! });
  }, [setLastCall]);

  const createOrder: ShopCtx["createOrder"] = useCallback((data) => {
    const number = numberRef.current++;
    const order: Order = { ...data, customer: customerName(data.customer), status: "producao", total: orderTotal(data.items), id: uid(), number, createdAt: Date.now(), updatedAt: Date.now(), callCount: 0 };
    setOrders((prev) => [order, ...prev]);
    setSettings((s) => ({ ...s, nextNumber: number + 1 }));
    return order;
  }, [setOrders, setSettings]);

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = { ...o, ...patch, customer: customerName(patch.customer ?? o.customer), updatedAt: Date.now() };
      if (patch.items) next.total = orderTotal(patch.items);
      if (patch.status && patch.status !== o.status) {
        next.finishedAt = patch.status === "finalizado" ? Date.now() : undefined;
        if (patch.status === "pronto") {
          return stampCall({ ...next, status: o.status, readyAt: Date.now() });
        }
        if (patch.status === "producao") {
          next.readyAt = undefined;
          next.calledAt = undefined;
          next.callCount = 0;
        }
      }
      return next;
    }));
    const updated = ordersRef.current.find(order => order.id === id);
    if (patch.status === "pronto" && updated?.calledAt) recordCall(updated);
  }, [setOrders, ordersRef, stampCall, recordCall]);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setLastCall(prev => prev?.orderId === id ? null : prev);
  }, [setOrders, setLastCall]);

  const sendCall = useCallback((id: string, allowProduction: boolean): Order | null => {
    const current = ordersRef.current.find(order => order.id === id);
    if (!current || (current.status !== "pronto" && !(allowProduction && current.status === "producao"))) return null;
    const called = stampCall(current);
    setOrders(previous => previous.map(order => order.id === called.id ? called : order));
    recordCall(called);
    return called;
  }, [ordersRef, setOrders, stampCall, recordCall]);
  const callOrder = useCallback((order: Order) => sendCall(order.id, false), [sendCall]);
  const readyAndCall = useCallback((order: Order) => sendCall(order.id, true), [sendCall]);

  const resetDefaults = useCallback(() => {
    setProducts(DEFAULT_PRODUCTS);
    setExtras(DEFAULT_EXTRAS);
    setSettings({ ...DEFAULT_SETTINGS, nextNumber });
  }, [setProducts, setExtras, setSettings, nextNumber]);

  const value = useMemo(() => ({ products, setProducts, extras, setExtras, orders, setOrders, settings, setSettings, lastCall, nextNumber, storageError, ...media, ...link, openPanel, panelOpenError, createOrder, updateOrder, deleteOrder, callOrder, readyAndCall, resetDefaults }),
    [products, setProducts, extras, setExtras, orders, setOrders, settings, setSettings, lastCall, nextNumber, storageError, media, link, openPanel, panelOpenError, createOrder, updateOrder, deleteOrder, callOrder, readyAndCall, resetDefaults]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop fora do ShopProvider");
  return ctx;
}
