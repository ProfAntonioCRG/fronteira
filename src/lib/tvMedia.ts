import { useCallback, useEffect, useRef, useState } from "react";

export interface TvSlide {
  id: string;
  name: string;
  src: string;
  enabled: boolean;
}

export const MAX_TV_SLIDES = 10;
const CHANGE_KEY = "fronteira_tv_media_changed_v1";
let database: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Este navegador não permite salvar imagens. Use uma janela normal do Chrome, Edge ou Firefox."));
        return;
      }
      const request = indexedDB.open("fronteira_media_v1", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("media");
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); database = undefined; };
        resolve(request.result);
      };
      request.onerror = () => reject(new Error("Não foi possível abrir o armazenamento das imagens neste navegador."));
      request.onblocked = () => reject(new Error("Feche as outras janelas da loja e tente carregar as imagens novamente."));
    });
    database.catch(() => { database = undefined; });
  }
  return database;
}

export function validateTvSlides(value: unknown): TvSlide[] {
  if (!Array.isArray(value) || value.length > MAX_TV_SLIDES) throw new Error("A playlist pode ter no máximo 10 imagens.");
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item.id !== "string" || ids.has(item.id) || typeof item.name !== "string"
      || typeof item.enabled !== "boolean" || typeof item.src !== "string"
      || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.src)
      || item.src.length > 25_000_000) {
      throw new Error("O arquivo contém uma imagem de TV inválida. Use um backup exportado pelo sistema.");
    }
    ids.add(item.id);
  }
  return value as TvSlide[];
}

async function readSlides(): Promise<TvSlide[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("media", "readonly").objectStore("media").get("playlist");
    request.onsuccess = () => {
      try { resolve(validateTvSlides(request.result || [])); } catch (error) { reject(error); }
    };
    request.onerror = () => reject(new Error("Não foi possível ler as imagens salvas."));
  });
}

async function writeSlides(slides: TvSlide[]): Promise<void> {
  validateTvSlides(slides);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("media", "readwrite");
    transaction.objectStore("media").put(slides, "playlist");
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(new Error("As imagens não foram salvas. Verifique o espaço disponível no navegador e tente novamente."));
  });
}

export async function imageFileToSlide(file: File): Promise<TvSlide> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`${file.name}: selecione uma imagem JPG, PNG ou WebP.`);
  if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name}: o limite é de 15 MB por arquivo.`);
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`${file.name}: não foi possível abrir esta imagem.`));
      img.src = url;
    });
    const scale = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a imagem.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name: file.name, src: canvas.toDataURL("image/webp", 0.92), enabled: true };
  } finally { URL.revokeObjectURL(url); }
}

export function useTvMedia() {
  const [tvSlides, setTvSlides] = useState<TvSlide[]>([]);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const request = ++generation.current;
      try {
        const slides = await readSlides();
        if (mounted && request === generation.current) { setTvSlides(slides); setMediaError(""); }
      } catch (error) {
        if (mounted) setMediaError(error instanceof Error ? error.message : "Erro ao carregar imagens.");
      } finally { if (mounted) setMediaLoaded(true); }
    };
    void refresh();
    const onStorage = (event: StorageEvent) => { if (event.key === CHANGE_KEY) void refresh(); };
    window.addEventListener("storage", onStorage);
    try {
      channel.current = new BroadcastChannel("fronteira_tv_media");
      channel.current.onmessage = () => void refresh();
    } catch { channel.current = null; }
    return () => { mounted = false; window.removeEventListener("storage", onStorage); channel.current?.close(); };
  }, []);

  const saveTvSlides = useCallback(async (slides: TvSlide[]) => {
    await writeSlides(slides);
    generation.current++;
    setTvSlides(slides);
    setMediaError("");
    channel.current?.postMessage("updated");
    try { localStorage.setItem(CHANGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* IndexedDB is already committed. */ }
  }, []);

  return { tvSlides, mediaLoaded, mediaError, saveTvSlides };
}