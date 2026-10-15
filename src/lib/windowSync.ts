export type WindowRole = "operator" | "panel";
export type SyncMessage =
  | { type: "state"; key: string; raw: string }
  | { type: "hello"; role: WindowRole }
  | { type: "presence"; role: WindowRole; audio: boolean }
  | { type: "bye" }
  | { type: "call-ack"; orderId: string; at: number };

type Envelope = { app: "fronteira-sync-v2"; id: string; sender: string; message: SyncMessage };
type Listener = (message: SyncMessage, sender: string) => void;
const CLIENT = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const SIGNAL_KEY = "fronteira_window_signal_v2";
const listeners = new Set<Listener>();
const windows = new Set<Window>();
const seen = new Set<string>();
let channel: BroadcastChannel | null = null;
let stop: (() => void) | undefined;

function receive(value: unknown) {
  const data = value as Partial<Envelope> | null;
  if (!data || data.app !== "fronteira-sync-v2" || typeof data.id !== "string" || typeof data.sender !== "string"
    || data.sender === CLIENT || seen.has(data.id) || !data.message) return;
  seen.add(data.id);
  if (seen.size > 400) seen.delete(seen.values().next().value!);
  for (const listener of listeners) listener(data.message, data.sender);
}

function start() {
  try {
    channel = new BroadcastChannel("fronteira-sync-v2");
    channel.onmessage = event => receive(event.data);
  } catch { channel = null; }
  const storage = (event: StorageEvent) => {
    if (event.key !== SIGNAL_KEY || !event.newValue) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* Ignore incomplete signals. */ }
  };
  const direct = (event: MessageEvent) => {
    // Only accept direct messages from the actual window we opened (or its opener).
    if (event.origin !== location.origin || !event.source) return;
    if (event.source !== window.opener && !windows.has(event.source as Window)) return;
    receive(event.data);
  };
  window.addEventListener("storage", storage);
  window.addEventListener("message", direct);
  stop = () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener("message", direct);
    channel?.close(); channel = null; stop = undefined;
  };
}

export function subscribeWindows(listener: Listener) {
  if (!stop) start();
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}

export function sendToWindows(message: SyncMessage) {
  const envelope: Envelope = { app: "fronteira-sync-v2", id: `${CLIENT}-${Date.now()}-${Math.random()}`, sender: CLIENT, message };
  try { channel?.postMessage(envelope); } catch { /* Other transports remain available. */ }
  if (message.type !== "state") {
    try { localStorage.setItem(SIGNAL_KEY, JSON.stringify(envelope)); } catch { /* Broadcast and opener still work without storage. */ }
  }
  const targets = new Set(windows);
  if (window.opener) targets.add(window.opener);
  for (const target of targets) {
    try {
      if (target.closed) { windows.delete(target); continue; }
      target.postMessage(envelope, location.origin);
    } catch { windows.delete(target); }
  }
}

export function openTvWindow(): boolean {
  if (location.protocol === "file:") return false;
  const url = new URL(location.href);
  url.hash = "/painel";
  for (const existing of windows) {
    try {
      if (!existing.closed && existing.location.href === url.href) { existing.focus(); return true; }
    } catch { windows.delete(existing); }
  }
  const popup = window.open(url.href, "fronteira-painel-tv", "popup=yes,width=1366,height=768");
  if (!popup) return false;
  windows.add(popup);
  popup.focus();
  return true;
}