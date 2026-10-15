import { useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, Clock3, Maximize, Megaphone, Pause, Play, Settings2, Volume2, VolumeX, X } from "lucide-react";
import { brl, pad, useShop } from "../lib/shop";
import { useSlideshow } from "../lib/useSlideshow";
import Logo from "./Logo";
import Modal from "./Modal";
import TvSettings from "./TvSettings";
import { WhatsAppTvContact } from "./WhatsAppContact";
import { whatsAppContact } from "../lib/whatsapp";
import ResilientImage from "./ResilientImage";
import { useCallAudio } from "../lib/useCallAudio";

interface Slide { id: string; img: string; title: string; desc: string; price?: number; custom: boolean; }

const FALLBACK_SLIDES: Slide[] = [
  { id: "fallback-acai", custom: false, img: "https://images.pexels.com/photos/5232938/pexels-photo-5232938.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600", title: "Fronteira Açaí & Doces", desc: "Seu momento mais gostoso do dia." },
  { id: "fallback-doces", custom: false, img: "https://images.pexels.com/photos/33312981/pexels-photo-33312981.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600", title: "Feito com carinho", desc: "Conheça nossos doces no balcão." },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}

export default function TvPanel() {
  const { orders, products, settings, tvSlides, operatorConnected, setPanelAudioEnabled, acknowledgeCall, storageError } = useShop();
  const now = useClock();
  const [callFlashing, setFlash] = useState(false);
  const [paused, setPaused] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [controlError, setControlError] = useState("");

  const slides = useMemo<Slide[]>(() => {
    const uploaded = tvSlides.filter(item => item.enabled).map(item => ({ id: item.id, img: item.src, title: item.name, desc: "", custom: true }));
    if (uploaded.length) return uploaded;
    const featured = products.filter(p => p.active && p.image).slice(0, 10)
      .map(p => ({ id: p.id, img: p.image, title: p.name, desc: p.description, price: p.price, custom: false }));
    return featured.length ? featured : FALLBACK_SLIDES;
  }, [products, tvSlides]);
  const { currentId, select } = useSlideshow(slides.map(item => item.id), settings.slideSeconds, settings.slideOrder, paused || configuring);

  const ready = useMemo(() => orders.filter(o => o.status === "pronto")
    .sort((a, b) => (b.calledAt || b.readyAt || 0) - (a.calledAt || a.readyAt || 0)), [orders]);
  const preparing = useMemo(() => orders.filter(o => o.status === "producao").sort((a, b) => b.createdAt - a.createdAt), [orders]);
  const current = ready[0];
  const received = preparing[0];
  const last3 = ready.slice(0, 3);
  const flash = callFlashing && !!current;
  const audio = useCallAudio(settings.soundOnPanel, settings.voiceOnPanel, ready.map(order => order.id));
  const knownCalls = useRef(new Set(orders.filter(order => order.calledAt).map(order => `${order.id}:${order.calledAt}`)));
  const currentOrderId = current?.id;
  const calledAt = current?.calledAt;
  useEffect(() => {
    const newCalls = ready.filter(order => order.calledAt && !knownCalls.current.has(`${order.id}:${order.calledAt}`))
      .sort((a, b) => a.calledAt! - b.calledAt!);
    for (const order of newCalls) {
      knownCalls.current.add(`${order.id}:${order.calledAt}`);
      if (Date.now() - order.calledAt! < 30000) audio.announce(order);
    }
    if (knownCalls.current.size > 500) knownCalls.current = new Set(ready.filter(order => order.calledAt).map(order => `${order.id}:${order.calledAt}`));
  }, [ready, audio.announce]);
  useEffect(() => {
    setPanelAudioEnabled(audio.enabled && settings.soundOnPanel);
  }, [audio.enabled, settings.soundOnPanel, setPanelAudioEnabled]);
  useEffect(() => {
    if (!currentOrderId || !calledAt) { setFlash(false); return; }
    acknowledgeCall(currentOrderId, calledAt);
    setFlash(Date.now() - calledAt < 10000);
    const timer = setTimeout(() => setFlash(false), 9000);
    return () => clearTimeout(timer);
  }, [currentOrderId, calledAt, acknowledgeCall]);

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setControlError("");
    } catch { setControlError("Tela cheia indisponível neste ambiente. Use F11 na janela da TV."); }
  };
  const s = slides.find(item => item.id === currentId) || slides[0];
  const showWhatsApp = settings.whatsapp.enabled && whatsAppContact(settings.whatsapp).valid;

  return (
    <div className="tv-screen bg-[#2a0218] text-white relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(233,185,73,0.14),transparent_50%)]" />

      {/* Topo */}
      <header className="tv-header relative z-10">
        <Logo size={60} light />
        <div className="tv-header-message text-center">
          <p className="font-display font-bold text-amber-300 tracking-[0.25em] uppercase text-sm">Painel de pedidos</p>
          <p className="text-purple-200 font-semibold text-lg">{settings.panelMessage}</p>
          <p className={`tv-link-status ${operatorConnected ? "connected" : ""}`}><span />{operatorConnected ? "Conectado ao atendimento" : "Aguardando conexão com o atendimento"}</p>
        </div>
        <div className="text-right">
          {settings.showPanelTime && <p className="font-display font-black text-3xl leading-none tabular-nums">{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}
          {settings.showPanelDate && <p className="text-purple-300 font-bold capitalize text-xs mt-1">{now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>}
          <div className="tv-toolbar">
            <button onClick={() => setConfiguring(true)}><Settings2 size={15} /> Configurar TV</button>
            <button onClick={() => setPaused(value => !value)}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? "Reproduzir" : "Pausar"}</button>
            <button onClick={() => audio.enabled ? audio.mute() : void audio.activate()} disabled={!settings.soundOnPanel}>{audio.enabled && settings.soundOnPanel ? <Volume2 size={15} /> : <VolumeX size={15} />}{!settings.soundOnPanel ? "Som desligado" : audio.enabled ? "Silenciar" : "Ativar som e voz"}</button>
            <button onClick={() => void audio.activate(true)} disabled={!settings.soundOnPanel}>Testar chamada</button>
            <button onClick={() => void fullscreen()}><Maximize size={15} /> Tela cheia</button>
          </div>
        </div>
      </header>
      {controlError && <div className="tv-control-error" role="alert">{controlError}<button onClick={() => setControlError("")} aria-label="Fechar aviso"><X size={15} /></button></div>}
      {audio.error && <div className="tv-control-error" role="alert">{audio.error}<button onClick={audio.clearError} aria-label="Fechar aviso de áudio"><X size={15} /></button></div>}
      {storageError && <div className="tv-control-error" role="alert">{storageError}</div>}
      {settings.soundOnPanel && !audio.enabled && <div className="tv-audio-unlock"><Volume2 size={17} /><span>Para ouvir o número e o nome do cliente, ative o áudio nesta janela.</span><button onClick={() => void audio.activate()}>Ativar chamadas por voz</button></div>}

      {/* Meio */}
      <main className="tv-main relative z-10">
        {/* Vitrine / slideshow */}
        <section className="tv-media relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#1b0316]" aria-label="Apresentação de imagens e cardápios">
          {slides.map(sl => (
            <ResilientImage key={sl.id} src={sl.img} alt={sl.title} aria-hidden={sl.id !== s.id} style={{ objectFit: sl.custom ? settings.slideFit : "cover" }}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${sl.id === s.id ? `opacity-100 ${!sl.custom ? "kenburns" : ""}` : "opacity-0"}`} />
          ))}
          {!s.custom && <>
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a0218] via-[#2a0218]/25 to-transparent" />
          <div className="tv-product-caption absolute bottom-0 left-0 right-0 p-7 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display font-black text-5xl leading-none drop-shadow-lg">{s.title}</h2>
              <p className="text-purple-100 font-semibold text-xl mt-2 drop-shadow">{s.desc}</p>
            </div>
            {s.price !== undefined && <div className="shrink-0 text-center bg-white text-purple-950 rounded-3xl px-5 py-3 shadow-2xl rotate-[-2deg]">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-400">a partir de</p>
              <p className="font-display font-black text-3xl leading-none">{brl(s.price)}</p>
            </div>}
          </div>
          </>}
          {slides.length > 1 && <div className={`tv-slide-dots ${s.custom ? "custom-slide-dots" : ""}`}>
            {slides.map((item, index) => <button key={item.id} aria-label={`Mostrar imagem ${index + 1}: ${item.title}`} aria-pressed={item.id === s.id} onClick={() => select(item.id)} className={item.id === s.id ? "active" : ""} />)}
          </div>}
        </section>

        {/* Chamada principal */}
        <section className={`tv-current relative rounded-[2rem] overflow-hidden border-2 flex flex-col text-center shadow-2xl transition-colors duration-500 ${flash && current ? "border-amber-300 bg-gradient-to-b from-amber-400/25 via-purple-900 to-purple-950" : "border-white/10 bg-gradient-to-b from-purple-900/90 to-purple-950/90"}`} aria-live="polite">
          <div className="tv-current-content">
          {current ? (
            <>
              <p className={`flex items-center gap-2 font-display font-extrabold uppercase tracking-[0.2em] text-lg ${flash ? "text-amber-300" : "text-emerald-300"}`}>
                <Megaphone className={flash ? "animate-wiggle" : ""} /> Pedido pronto
              </p>
              <p className="text-purple-200 font-bold uppercase tracking-widest text-sm mt-4">Retire no balcão</p>
              <p key={`${current.id}:${current.calledAt}`} className={`tv-order-number font-display font-black leading-none my-2 text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-400 drop-shadow ${flash ? "animate-call" : ""}`}>
                {pad(current.number)}
              </p>
              <p className="tv-customer-name font-display font-extrabold max-w-full px-2">{current.customer}</p>
              <p className="tv-order-description text-purple-300 font-semibold mt-2">{current.items.reduce((sum, i) => sum + i.qty, 0)} itens · {current.items[0]?.name}{current.items.length > 1 ? ` e mais ${current.items.length - 1}` : ""}</p>
              {flash && <span className="mt-5 bg-amber-400 text-purple-950 font-display font-black px-6 py-2.5 rounded-full text-xl uppercase tracking-wide animate-pulse shadow-xl">Retire agora</span>}
            </>
          ) : received ? (
            <div className="tv-received-order" key={received.id}>
              <p className="tv-received-label"><ChefHat size={22} /> Pedido recebido</p>
              <p className="tv-received-caption">Em preparo</p>
              <p className="tv-order-number font-display font-black">{pad(received.number)}</p>
              <p className="tv-customer-name font-display font-extrabold">{received.customer}</p>
              <p className="tv-received-help">Estamos preparando seu pedido.<br />Aguarde a chamada para retirar.</p>
            </div>
          ) : (
            <>
              <img src="images/logo.png" alt="Fronteira" className="tv-waiting-logo rounded-full object-cover ring-4 ring-amber-400/70 shadow-2xl mb-5" />
              <p className="font-display font-black text-4xl leading-tight">Seu pedido está<br />a caminho...</p>
              <p className="text-purple-300 font-semibold text-lg mt-3 max-w-sm">Assim que ficar pronto, seu número aparece aqui bem grandão. Fique de olho!</p>
            </>
          )}
          </div>
          {preparing.length > 0 && (
            <div className="tv-preparing bg-black/30 backdrop-blur px-5 py-3.5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-purple-300 flex items-center justify-center gap-1.5"><ChefHat size={13} /> Em preparo agora</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {preparing.slice(0, 3).map(o => <span key={o.id} className="tv-preparing-name">Nº {pad(o.number)} · {o.customer}</span>)}
                {preparing.length > 3 && <span className="text-purple-300 font-bold self-center">+{preparing.length - 3}</span>}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Últimas chamadas */}
      <footer className={`tv-footer relative z-10 ${showWhatsApp ? "tv-footer-with-contact" : ""}`}>
        <div className="tv-last-calls">
        <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-purple-300 mb-3 flex items-center gap-2"><Clock3 size={14} /> Últimas chamadas · pedidos prontos</p>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(idx => {
            const o = last3[idx];
            const principal = idx === 0 && !!o;
            return (
              <div key={idx} className={`tv-recent rounded-3xl flex items-center gap-4 border-2 transition-all ${principal ? "bg-gradient-to-r from-amber-400 to-amber-300 text-purple-950 border-amber-200 shadow-2xl shadow-amber-500/20" : "bg-white/[0.07] border-white/10 text-white"}`}>
                <div className="min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${principal ? "text-purple-800" : "text-purple-300"}`}>{principal ? "Retire agora" : idx === 1 ? "Chamada anterior" : "Também pronto"}</p>
                  {o ? <>
                    <p className="tv-recent-number font-display font-black leading-none mt-1">Nº {pad(o.number)}</p>
                    <p className={`font-extrabold text-lg truncate ${principal ? "text-purple-900" : "text-purple-100"}`}>{o.customer}</p>
                  </> : <>
                    <p className="tv-recent-number font-display font-black leading-none mt-1 opacity-30">---</p>
                    <p className="font-bold text-purple-300">Aguardando...</p>
                  </>}
                </div>
                {principal && <Megaphone className={`ml-auto shrink-0 ${flash ? "animate-wiggle" : ""}`} size={32} />}
              </div>
            );
          })}
        </div>
        </div>
        {showWhatsApp && <WhatsAppTvContact />}
      </footer>

      {configuring && <Modal label="Configurar apresentação da TV" onClose={() => setConfiguring(false)} className="tv-settings-modal">
        <header className="modal-heading"><div><p className="eyebrow">PAINEL DA LOJA</p><h2>Configurar TV</h2></div><button className="icon-action" aria-label="Fechar configurações da TV" onClick={() => setConfiguring(false)}><X size={20} /></button></header>
        <div className="modal-scroll nice-scroll"><TvSettings inPanel /></div>
      </Modal>}
    </div>
  );
}
