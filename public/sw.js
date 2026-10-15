/* Only cache the app's own shell and public images. Order data remains in browser storage. */
const ROOT = new URL("./", self.location.href);
const SHELL = new URL("index.html", ROOT).href;
const PREFIX = `fronteira-offline-${encodeURIComponent(ROOT.pathname)}-`;
const CACHE = `${PREFIX}v1`;
const PHOTOS = `${PREFIX}photos-v1`;
const CORE = ["index.html", "images/logo.png", "images/app-icon.svg", "manifest.webmanifest"].map(path => new URL(path, ROOT).href);

async function saveCore() {
  const cache = await caches.open(CACHE);
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 20000);
  try {
    const response = await fetch(new Request(SHELL, { cache: "reload", signal: abort.signal }));
    if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) throw new Error("Application shell is unavailable.");
    const html = await response.clone().text();
    if (html.includes("/@vite/client")) throw new Error("Offline mode requires a production build.");
    await cache.addAll(CORE.slice(1).map(url => new Request(url, { cache: "reload", signal: abort.signal })));
    await cache.put(SHELL, response);
  } finally { clearTimeout(timeout); }
}

self.addEventListener("install", event => {
  event.waitUntil(saveCore());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== PHOTOS).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function appShell(request) {
  const cache = await caches.open(CACHE);
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 4000);
  try {
    const response = await fetch(request, { signal: abort.signal, cache: "no-cache" });
    if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) throw new Error("Offline fallback needed.");
    try { await cache.put(SHELL, response.clone()); } catch { /* Keep serving even if storage is full. */ }
    return response;
  } catch {
    return await cache.match(SHELL) || new Response("Abra o aplicativo com conexao uma vez para preparar o acesso offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } finally { clearTimeout(timeout); }
}

async function imageOrAsset(request) {
  const local = new URL(request.url).origin === ROOT.origin;
  const cache = await caches.open(local ? CACHE : PHOTOS);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      try {
        await cache.put(request, response.clone());
        if (!local) {
          const keys = await cache.keys();
          await Promise.all(keys.slice(0, Math.max(0, keys.length - 60)).map(key => cache.delete(key)));
        }
      } catch { /* Optional photos must never block an order. */ }
    }
    return response;
  } catch { return Response.error(); }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const local = url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname);
  if (local && request.mode === "navigate" && (url.pathname === ROOT.pathname || url.pathname === new URL(SHELL).pathname)) {
    event.respondWith(appShell(request));
  } else if ((local && ["image", "font", "style", "script", "manifest"].includes(request.destination) && !url.pathname.endsWith("/sw.js"))
    || (url.hostname === "images.pexels.com" && request.destination === "image")) {
    event.respondWith(imageOrAsset(request));
  }
});

self.addEventListener("message", event => {
  if (!["FRONTEIRA_OFFLINE_STATUS", "FRONTEIRA_PREPARE_OFFLINE"].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === "FRONTEIRA_PREPARE_OFFLINE") await saveCore();
      const cache = await caches.open(CACHE);
      const ready = (await Promise.all(CORE.map(url => cache.match(url)))).every(Boolean);
      event.ports[0]?.postMessage({ ready });
    } catch {
      event.ports[0]?.postMessage({ ready: false, error: "Nao foi possivel salvar os arquivos. Confira a conexao e o armazenamento do navegador." });
    }
  })());
});