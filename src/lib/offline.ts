export type OfflineState = "checking" | "unprepared" | "ready" | "unavailable";

function appRoot() { return new URL("./", window.location.href); }

async function readWorkerStatus(worker: ServiceWorker, prepare = false): Promise<boolean> {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const finish = (ready: boolean) => { clearTimeout(timer); channel.port1.close(); resolve(ready); };
    const timer = setTimeout(() => finish(false), prepare ? 25000 : 4000);
    channel.port1.onmessage = event => finish(event.data?.ready === true);
    worker.postMessage({ type: prepare ? "FRONTEIRA_PREPARE_OFFLINE" : "FRONTEIRA_OFFLINE_STATUS" }, [channel.port2]);
  });
}

export async function getOfflineState(): Promise<OfflineState> {
  if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) return "unavailable";
  try {
    const root = appRoot();
    const registration = await navigator.serviceWorker.getRegistration(root.href);
    if (!registration?.active || registration.active.scriptURL !== new URL("sw.js", root).href) return "unprepared";
    return await readWorkerStatus(registration.active) ? "ready" : "unprepared";
  } catch { return "unavailable"; }
}

export async function prepareOffline(): Promise<void> {
  if (!import.meta.env.PROD) throw new Error("Prepare o acesso offline na versão compilada, usando o inicializador local ou o endereço publicado. A prévia de desenvolvimento não é armazenada.");
  if (!window.isSecureContext || !("serviceWorker" in navigator)) throw new Error("Use HTTPS no site publicado ou o inicializador local em localhost, em um navegador compatível.");
  const root = appRoot();
  const registration = await navigator.serviceWorker.register(new URL("sw.js", root).href, { scope: root.href, updateViaCache: "none" });
  if (!registration.active) {
    await new Promise<void>((resolve, reject) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) { reject(new Error("O navegador não iniciou a preparação offline. Tente novamente.")); return; }
      const cleanup = () => { clearTimeout(timeout); worker.removeEventListener("statechange", changed); };
      const changed = () => {
        if (worker.state === "activated") { cleanup(); resolve(); }
        else if (worker.state === "redundant") { cleanup(); reject(new Error("Não foi possível salvar os arquivos. Verifique a conexão, o espaço e as permissões do navegador.")); }
      };
      const timeout = setTimeout(() => { cleanup(); reject(new Error("A preparação demorou mais que o esperado. Confira a conexão e tente novamente.")); }, 25000);
      worker.addEventListener("statechange", changed);
      changed();
    });
  }
  if (!registration.active) throw new Error("A cópia offline ainda não foi confirmada. Reabra esta aba e tente novamente.");
  if (!await readWorkerStatus(registration.active) && !await readWorkerStatus(registration.active, true)) {
    throw new Error("Não foi possível salvar a cópia offline. Confira a conexão, o espaço e as permissões do navegador e tente novamente.");
  }
}