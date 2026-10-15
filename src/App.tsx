import { useEffect, useMemo, useState } from "react";
import { ClipboardList, IceCreamBowl, MonitorPlay, Settings as SettingsIcon } from "lucide-react";
import { ShopProvider, uid, useShop, type Order } from "./lib/shop";
import Logo from "./components/Logo";
import Pos, { type RepeatRequest } from "./components/Pos";
import OrdersBoard from "./components/OrdersBoard";
import SettingsPanel, { type SettingsTab } from "./components/SettingsPanel";
import TvPanel from "./components/TvPanel";

type View = "atendimento" | "pedidos" | "config";

function isPanelHash() { return window.location.hash.replace("#", "").startsWith("/painel"); }

function Shell() {
  const { orders, storageError, openPanel, panelOpenError, panelCount, panelHasAudio } = useShop();
  const [view, setView] = useState<View>("atendimento");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("loja");
  const [repeatRequest, setRepeatRequest] = useState<RepeatRequest | null>(null);
  const active = orders.filter(o => ["producao", "pronto"].includes(o.status)).length;
  const ready = orders.filter(o => o.status === "pronto").length;
  const todayOrders = useMemo(() => orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== "cancelado"), [orders]);
  const revenue = todayOrders.filter(o => o.status === "finalizado").reduce((s, o) => s + o.total, 0);
  const repeatOrder = (order: Order) => { setRepeatRequest({ key: uid(), order }); setView("atendimento"); };

  const nav: { id: View; label: string; desc: string; icon: typeof IceCreamBowl; badge?: number }[] = [
    { id: "atendimento", label: "Atendimento", desc: "Montar pedido", icon: IceCreamBowl },
    { id: "pedidos", label: "Pedidos", desc: "Fila e produção", icon: ClipboardList, badge: active },
    { id: "config", label: "Configurações", desc: "Loja, TV e cupom", icon: SettingsIcon },
  ];

  return (
    <div className="app-shell">
      {/* Barra lateral */}
      <aside className="app-sidebar bg-gradient-to-b from-[#2a0218] via-purple-950 to-[#3d0a2a] text-white">
        <div className="p-4 pb-5 border-b border-white/10"><Logo size={46} light /></div>
        <nav className="p-3.5 space-y-2">
          {nav.map(({ id, label, desc, icon: Icon, badge }) => (
            <button key={id} onClick={() => setView(id)}
              className={`w-full flex items-center gap-2.5 rounded-2xl px-3 py-3.5 text-left transition-all cursor-pointer ${view === id ? "bg-amber-400 text-purple-950 shadow-lg shadow-amber-500/20" : "hover:bg-white/10 text-purple-100"}`}>
              <Icon size={21} strokeWidth={2.4} className="shrink-0" />
              <span className="flex-1 leading-tight">
                <span className="block font-display font-extrabold text-[16px]">{label}</span>
                <span className={`block text-xs font-semibold ${view === id ? "text-purple-800" : "text-purple-300"}`}>{desc}</span>
              </span>
              {!!badge && <span className={`font-display font-extrabold text-sm px-2.5 py-0.5 rounded-full ${view === id ? "bg-purple-950 text-amber-300" : "bg-fuchsia-600 text-white"}`}>{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="px-3.5">
          <button onClick={openPanel} className="w-full rounded-2xl border-2 border-dashed border-amber-400/50 hover:border-amber-300 hover:bg-amber-400/10 text-amber-300 px-4 py-3.5 flex items-center gap-3 transition cursor-pointer">
            <MonitorPlay size={23} />
            <span className="text-left leading-tight">
              <span className="block font-display font-extrabold text-[16px]">Painel da TV</span>
              <span className="block text-xs font-semibold text-amber-200/70">Abrir tela de chamadas</span>
            </span>
          </button>
          <p className={`sidebar-panel-status ${panelCount ? "connected" : ""}`}><span />{panelCount ? `TV conectada${panelHasAudio ? " · áudio ativo" : " · áudio desativado"}` : "TV não conectada"}</p>
          <button className="w-full text-purple-200 hover:text-amber-300 text-xs font-bold py-3 cursor-pointer" onClick={() => { setSettingsTab("tv"); setView("config"); }}>Configurar TV e WhatsApp</button>
        </div>
        <div className="mt-auto p-4 space-y-2.5">
          {ready > 0 && <div className="bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-2xl px-4 py-3 font-extrabold text-sm animate-pulse">{ready} pedido(s) pronto(s) aguardando retirada</div>}
          <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-purple-300">Resumo de hoje</p>
            <div className="flex justify-between mt-2.5 text-sm font-bold text-purple-100"><span>Pedidos</span><span className="font-display text-white text-base">{todayOrders.length}</span></div>
            <div className="flex justify-between text-sm font-bold text-purple-100"><span>Em andamento</span><span className="font-display text-white text-base">{active}</span></div>
            <div className="flex justify-between text-sm font-bold text-purple-100"><span>Vendido</span><span className="font-display text-amber-300 text-base">{revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
          </div>
          <p className="text-center text-[11px] font-semibold text-purple-400 px-2">Dados salvos automaticamente neste computador.</p>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="app-content">
        <header className="mobile-app-header bg-gradient-to-r from-[#2a0218] to-purple-900 px-4 py-3 items-center justify-between">
          <Logo size={44} light />
          <button onClick={openPanel} className="bg-amber-400 text-purple-950 font-extrabold text-sm rounded-xl px-3.5 py-2.5 flex items-center gap-1.5"><MonitorPlay size={17} /> TV</button>
        </header>
        <nav className="mobile-app-nav grid-cols-3 gap-2 p-3 bg-[#faf5ff]">
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setView(id)} className={`relative h-12 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 ${view === id ? "bg-purple-800 text-white" : "bg-white text-purple-800 border-2 border-purple-100"}`}>
              <Icon size={18} /> {label}
              {!!badge && <span className="absolute -top-1.5 -right-1.5 bg-fuchsia-600 text-white text-[11px] font-black w-6 h-6 grid place-items-center rounded-full">{badge}</span>}
            </button>
          ))}
        </nav>

        <main className="app-main">
          {storageError && <p className="feedback error" role="alert">{storageError}</p>}
          {panelOpenError && <p className="feedback error" role="alert">{panelOpenError}</p>}
          <div className="page-heading">
            <div>
              <h1 className="font-display font-black text-purple-950 text-3xl leading-none">
                {view === "atendimento" ? "Atendimento" : view === "pedidos" ? "Pedidos" : "Configurações"}
              </h1>
              <p className="text-purple-500 font-semibold text-sm mt-1.5">
                {view === "atendimento" ? "Escolha os produtos ao centro e revise o pedido à direita." : view === "pedidos" ? "Produza, chame o cliente e marque como entregue. Tudo fica no histórico." : "Produtos, apresentação da TV e impressão do cupom, do seu jeito."}
              </p>
            </div>
            <span className="flex items-center gap-2 bg-emerald-100 text-emerald-800 font-extrabold text-sm px-4 py-2.5 rounded-full border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Loja aberta
            </span>
          </div>

          <div className={`workspace-view pos-view ${view !== "atendimento" ? "is-hidden" : ""}`}><Pos repeatRequest={repeatRequest} onGoOrders={() => setView("pedidos")} /></div>
          {view === "pedidos" && <div className="workspace-view standard-view nice-scroll"><OrdersBoard onGoNew={() => setView("atendimento")} onRepeat={repeatOrder} /></div>}
          {view === "config" && <div className="workspace-view standard-view nice-scroll"><SettingsPanel tab={settingsTab} onTabChange={setSettingsTab} /></div>}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [panel, setPanel] = useState(isPanelHash());
  useEffect(() => {
    const onHash = () => setPanel(isPanelHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return <ShopProvider isPanel={panel}>{panel ? <TvPanel /> : <Shell />}</ShopProvider>;
}
