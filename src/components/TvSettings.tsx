import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ImagePlus, Images, LoaderCircle, MonitorPlay, QrCode, RefreshCw, Trash2, Upload } from "lucide-react";
import { useShop } from "../lib/shop";
import { imageFileToSlide, MAX_TV_SLIDES, type TvSlide } from "../lib/tvMedia";
import WhatsAppSettingsPanel from "./WhatsAppContact";
import PanelConnection from "./PanelConnection";

export default function TvSettings({ inPanel = false }: { inPanel?: boolean }) {
  const { settings, setSettings, tvSlides, saveTvSlides, mediaLoaded, mediaError, storageError, openPanel } = useShop();
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"slides" | "whatsapp">("slides");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [secondsText, setSecondsText] = useState(String(settings.slideSeconds));
  useEffect(() => setSecondsText(String(settings.slideSeconds)), [settings.slideSeconds]);
  const fileInput = useRef<HTMLInputElement>(null);
  const replacement = useRef<string | null>(null);
  const active = tvSlides.filter(slide => slide.enabled).length;

  const save = async (slides: TvSlide[], success: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await saveTvSlides(slides); setMessage(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar as alterações."); }
    finally { setBusy(false); }
  };

  const browse = (id: string | null = null) => {
    replacement.current = id;
    if (fileInput.current) { fileInput.current.multiple = !id; fileInput.current.click(); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    const selected = Array.from(files);
    const replaceId = replacement.current;
    if (!replaceId && tvSlides.length + selected.length > MAX_TV_SLIDES) {
      setError(`Você pode salvar até 10 imagens. Há ${MAX_TV_SLIDES - tvSlides.length} espaço(s) disponível(is). Remova uma imagem ou selecione menos arquivos.`);
      return;
    }
    if (replaceId && selected.length !== 1) { setError("Selecione uma única imagem para substituir."); return; }
    setBusy(true); setError(""); setMessage("Preparando as imagens...");
    try {
      const incoming: TvSlide[] = [];
      for (const [index, file] of selected.entries()) {
        setMessage(`Carregando imagem ${index + 1} de ${selected.length}...`);
        incoming.push(await imageFileToSlide(file));
      }
      const next = replaceId
        ? tvSlides.map(slide => slide.id === replaceId ? { ...incoming[0], id: slide.id, enabled: slide.enabled } : slide)
        : [...tvSlides, ...incoming];
      await saveTvSlides(next);
      setMessage(replaceId ? "Imagem substituída e salva. A TV será atualizada automaticamente." : `${incoming.length} imagem(ns) salva(s). Elas continuam disponíveis depois de fechar o navegador.`);
    } catch (cause) {
      setMessage(""); setError(cause instanceof Error ? cause.message : "Não foi possível carregar as imagens.");
    } finally { setBusy(false); replacement.current = null; }
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...tvSlides];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    void save(next, "Ordem de apresentação atualizada.");
  };

  return (
    <section className="settings-section tv-settings">
      <div className="settings-section-heading">
        <div><h2>Apresentação da TV</h2><p>Imagens, chamadas e o contato da loja em uma só tela.</p></div>
        {!inPanel && <button className="action-button primary" onClick={openPanel}><MonitorPlay size={18} /> Abrir painel da TV</button>}
      </div>
      <nav className="tv-settings-subnav" aria-label="Configurações da TV">
        <button className={section === "slides" ? "active" : ""} aria-pressed={section === "slides"} onClick={() => setSection("slides")}><Images size={17} /> Imagens e exibição</button>
        <button className={section === "whatsapp" ? "active" : ""} aria-pressed={section === "whatsapp"} onClick={() => setSection("whatsapp")}><QrCode size={17} /> WhatsApp na TV</button>
      </nav>
      <div className={section === "whatsapp" ? "" : "is-hidden"}><WhatsAppSettingsPanel /></div>
      <div className={section === "slides" ? "" : "is-hidden"}>
      {!inPanel && <PanelConnection />}
      <div className="tv-options-grid">
        <label className="field-label">Tempo de cada imagem
          <div className="input-with-suffix"><input type="number" min={2} max={120} step={1} value={secondsText} onChange={event => {
            setSecondsText(event.target.value);
            const value = Number(event.target.value);
            if (Number.isInteger(value) && value >= 2 && value <= 120) setSettings(current => ({ ...current, slideSeconds: value }));
          }} onBlur={() => {
            const value = Math.min(120, Math.max(2, Math.floor(Number(secondsText) || settings.slideSeconds)));
            setSecondsText(String(value)); setSettings(current => ({ ...current, slideSeconds: value }));
          }} /><span>segundos</span></div>
          <span className="settings-help">De 2 a 120 segundos.</span>
        </label>
        <label className="field-label">Ordem de apresentação
          <select className="form-input" value={settings.slideOrder} onChange={event => setSettings(current => ({ ...current, slideOrder: event.target.value as "sequence" | "shuffle" }))}>
            <option value="sequence">Em sequência, repetindo ao final</option><option value="shuffle">Aleatória, sem repetir antes de passar todas</option>
          </select>
        </label>
        <label className="field-label">Enquadramento das imagens
          <select className="form-input" value={settings.slideFit} onChange={event => setSettings(current => ({ ...current, slideFit: event.target.value as "contain" | "cover" }))}>
            <option value="contain">Imagem inteira (ideal para cardápios)</option><option value="cover">Preencher o espaço (pode cortar bordas)</option>
          </select>
        </label>
      </div>
      <div className="tv-display-toggles">
        <label className="settings-toggle"><span>Mostrar data</span><input type="checkbox" checked={settings.showPanelDate} onChange={event => setSettings(current => ({ ...current, showPanelDate: event.target.checked }))} /></label>
        <label className="settings-toggle"><span>Mostrar hora</span><input type="checkbox" checked={settings.showPanelTime} onChange={event => setSettings(current => ({ ...current, showPanelTime: event.target.checked }))} /></label>
        <label className="settings-toggle"><span>Som das chamadas</span><input type="checkbox" checked={settings.soundOnPanel} onChange={event => setSettings(current => ({ ...current, soundOnPanel: event.target.checked }))} /></label>
        <label className="settings-toggle"><span>Falar número e nome</span><input type="checkbox" checked={settings.voiceOnPanel} onChange={event => setSettings(current => ({ ...current, voiceOnPanel: event.target.checked }))} /></label>
      </div>
      <p className="settings-help mt-2">Na janela da TV, clique em <strong>Ativar som e voz</strong> uma vez e use <strong>Testar chamada</strong>. A voz depende do navegador e das vozes instaladas no computador; para falar offline, instale uma voz em português. A chamada visual funciona mesmo sem áudio.</p>
      <label className="field-label mt-4">Mensagem na tela da TV
        <input className="form-input" value={settings.panelMessage} maxLength={120} onChange={event => setSettings(current => ({ ...current, panelMessage: event.target.value }))} />
      </label>

      <div className="playlist-heading">
        <div><h3><Images size={20} /> Imagens e cardápios <span>{tvSlides.length}/10</span></h3><p>{active} imagem(ns) ativa(s). Use as setas para mudar a ordem.</p></div>
        <button className="action-button gold" disabled={busy || !mediaLoaded || tvSlides.length >= MAX_TV_SLIDES} onClick={() => browse()}>
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />} {busy ? "Carregando..." : "Buscar e carregar imagens"}
        </button>
        <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { void upload(event.target.files); event.target.value = ""; }} />
      </div>
      <p className="settings-help mb-4">JPG, PNG ou WebP, até 15 MB por arquivo. As imagens são otimizadas e gravadas no navegador. O modo “Imagem inteira” não corta o texto do cardápio.</p>

      {(error || mediaError || storageError) && <p role="alert" className="feedback error">{error || mediaError || storageError}</p>}
      {message && <p role="status" className="feedback success">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} {message}</p>}

      {!mediaLoaded ? <p className="settings-help py-8">Carregando imagens salvas...</p> : tvSlides.length === 0 ? (
        <button className="playlist-empty" disabled={busy} onClick={() => browse()}>
          <ImagePlus size={38} /><strong>Seu cardápio na tela da loja</strong><span>Selecione até 10 imagens do computador para criar a apresentação.</span><small>Enquanto não houver imagens ativas, a TV mostra os produtos do catálogo.</small>
        </button>
      ) : (
        <div className="playlist-grid">
          {tvSlides.map((slide, index) => <article className={`playlist-item ${slide.enabled ? "" : "disabled-slide"}`} key={slide.id}>
            <div className="playlist-image"><img src={slide.src} alt={slide.name} /><span>{String(index + 1).padStart(2, "0")}</span></div>
            <div className="playlist-item-body">
              <p title={slide.name} className="playlist-filename">{slide.name}</p>
              <label className="settings-toggle"><span>{slide.enabled ? "Ativa na TV" : "Pausada"}</span><input type="checkbox" disabled={busy} checked={slide.enabled} onChange={() => void save(tvSlides.map(item => item.id === slide.id ? { ...item, enabled: !item.enabled } : item), "Exibição da imagem atualizada.")} /></label>
              <div className="playlist-actions">
                <button className="icon-action" title="Mover para antes" aria-label={`Mover ${slide.name} para antes`} disabled={busy || index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button>
                <button className="icon-action" title="Mover para depois" aria-label={`Mover ${slide.name} para depois`} disabled={busy || index === tvSlides.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button>
                <button className="icon-action" title="Substituir imagem" aria-label={`Substituir ${slide.name}`} disabled={busy} onClick={() => browse(slide.id)}><RefreshCw size={17} /></button>
                <button className="icon-action danger" title="Remover imagem" aria-label={`Remover ${slide.name}`} disabled={busy} onClick={() => { if (confirm(`Remover "${slide.name}" da apresentação?`)) void save(tvSlides.filter(item => item.id !== slide.id), "Imagem removida da apresentação."); }}><Trash2 size={17} /></button>
              </div>
            </div>
          </article>)}
        </div>
      )}
      <p className="settings-help mt-5">As mudanças aparecem na TV aberta no mesmo endereço e perfil de navegador. Ative o som uma vez na janela da TV. Inclua as imagens no backup para levá-las a outro computador.</p>
      </div>
    </section>
  );
}