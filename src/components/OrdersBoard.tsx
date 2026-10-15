import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, Clock3, Megaphone, Minus, Pencil, Plus, Printer, RotateCcw, Search, Trash2, X } from "lucide-react";
import { brl, customerName, elapsed, fmtTime, itemTotal, orderTotal, pad, uid, useShop, type Order, type OrderStatus } from "../lib/shop";
import { printOrder } from "../lib/print";
import PanelConnection from "./PanelConnection";

function useNow(step = 15000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), step); return () => clearInterval(t); }, [step]);
  return now;
}

const COLS: { id: OrderStatus; title: string; head: string; soft: string; empty: string }[] = [
  { id: "producao", title: "Em produção", head: "bg-gradient-to-r from-amber-500 to-orange-500", soft: "bg-amber-50", empty: "Nenhum pedido em produção. Os pedidos confirmados no atendimento entram direto aqui." },
  { id: "pronto", title: "Prontos para entrega", head: "bg-gradient-to-r from-emerald-600 to-green-500", soft: "bg-emerald-50", empty: "Nenhum pedido aguardando entrega. Quando estiver pronto, chame o cliente quantas vezes precisar." },
  { id: "finalizado", title: "Pedidos entregues", head: "bg-gradient-to-r from-rose-600 to-red-500", soft: "bg-rose-50", empty: "Nenhum pedido entregue neste período. Aqui você poderá consultar e repetir um pedido anterior." },
];

export default function OrdersBoard({ onGoNew, onRepeat }: { onGoNew: () => void; onRepeat: (order: Order) => void }) {
  const { orders, updateOrder, deleteOrder, callOrder, readyAndCall, settings, callAcknowledgment, panelCount } = useShop();
  const now = useNow();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Order | null>(null);
  const [historyPeriod, setHistoryPeriod] = useState("all");
  const [notice, setNotice] = useState("");
  const [sentCall, setSentCall] = useState<Order | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);

  const filtered = orders.filter(o => `${pad(o.number)} ${o.customer}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  const today = new Date().toDateString();
  const finished = orders.filter(o => o.status === "finalizado" && new Date(o.finishedAt || o.createdAt).toDateString() === today);
  const revenue = finished.reduce((s, o) => s + o.total, 0);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const historyStart = historyPeriod === "today" ? startOfToday : historyPeriod === "week" ? startOfToday - 6 * 86400000 : 0;

  const move = (o: Order) => {
    if (o.status === "producao") { setSentCall(readyAndCall(o)); setNotice(""); }
    else if (o.status === "pronto") updateOrder(o.id, { status: "finalizado" });
  };
  const acknowledged = sentCall && callAcknowledgment?.orderId === sentCall.id && callAcknowledgment.at === sentCall.calledAt;

  return (
    <div>
      <PanelConnection />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" size={19} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou número do pedido..."
            className="w-full h-12 rounded-2xl bg-white border-2 border-purple-100 pl-11 pr-4 font-semibold text-purple-950 outline-none focus:border-purple-500 shadow-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <label className="text-xs font-bold text-purple-500">Entregues
            <select aria-label="Período dos pedidos entregues" className="ml-2 h-12 rounded-xl bg-white border-2 border-purple-100 text-purple-900 px-3 text-sm font-bold" value={historyPeriod} onChange={event => setHistoryPeriod(event.target.value)}><option value="all">Todos os dias</option><option value="today">Hoje</option><option value="week">Últimos 7 dias</option></select>
          </label>
          <button onClick={onGoNew} className="h-12 px-5 rounded-2xl bg-gradient-to-r from-purple-800 to-fuchsia-800 text-white font-display font-extrabold shadow-lg shadow-purple-800/25 flex items-center gap-2 cursor-pointer"><Plus size={19} strokeWidth={3} /> Novo pedido</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-bold text-purple-500"><span>Entrega de hoje: {finished.length} pedido(s) · {brl(revenue)}</span><span>Chamar na TV não marca o pedido como entregue.</span></div>
      {notice && <p className="feedback success" role="status"><Megaphone size={17} /> {notice}</p>}
      {sentCall && orders.some(order => order.id === sentCall.id && order.status === "pronto") && <p className={`feedback ${acknowledged ? "success" : "pending"}`} role="status"><Megaphone size={17} />{acknowledged
        ? `A TV recebeu a chamada ${sentCall.callCount}: Nº ${pad(sentCall.number)} · ${sentCall.customer}.`
        : `Chamada ${sentCall.callCount} registrada: Nº ${pad(sentCall.number)} · ${sentCall.customer}. ${panelCount ? "Aguardando confirmação da tela da TV." : "Abra o painel da TV e use Chamar novamente."}`}</p>}

      <div className="orders-board-grid">
        {COLS.map(col => {
          const list = filtered.filter(o => o.status === col.id && (col.id !== "finalizado" || (o.finishedAt || o.createdAt) >= historyStart))
            .sort((a, b) => col.id === "finalizado" ? (b.finishedAt || b.createdAt) - (a.finishedAt || a.createdAt) : a.createdAt - b.createdAt);
          return (
            <section key={col.id} className={`rounded-3xl overflow-hidden border-2 border-purple-100 bg-white shadow-sm min-h-105`}>
              <header className={`${col.head} px-4 py-3.5 flex items-center justify-between gap-2`}>
                <h3 className="font-display font-extrabold text-white text-lg">{col.title}</h3>
                <span className="bg-white/25 text-white font-display font-extrabold px-3 py-0.5 rounded-full">{list.length}</span>
              </header>
              <div className={`p-3 space-y-3 ${col.soft} min-h-90`}>
                {list.length === 0 && <p className="text-center text-purple-950/45 font-semibold text-sm px-4 py-10">{col.empty}</p>}
                {list.map(o => (
                  <article key={o.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-3.5 animate-pop">
                    {o.status === "pronto" && <button className="call-order-button" onClick={() => {
                      const called = callOrder(o);
                      setSentCall(called);
                      setNotice(called ? "" : "O pedido foi alterado. Confira o status antes de chamar novamente.");
                    }}><Megaphone size={20} /><span>{o.callCount ? "Chamar novamente" : "Chamar pedido"}</span><b>{o.callCount}x</b></button>}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-black text-purple-950 text-xl leading-tight break-words">Nº {pad(o.number)} <span className="text-purple-600">· {o.customer}</span></p>
                        <p className="text-xs font-bold text-purple-400 mt-1"><Clock3 size={12} className="inline mr-1" /> {o.status === "finalizado" ? `Entregue ${new Date(o.finishedAt || o.createdAt).toLocaleDateString("pt-BR")} às ${fmtTime(o.finishedAt || o.createdAt)}` : `${fmtTime(o.createdAt)} · há ${elapsed(o.createdAt, now)}`} · {o.type}</p>
                      </div>
                      <span className="font-display font-extrabold text-purple-900 bg-purple-50 px-2.5 py-1.5 rounded-xl">{brl(o.total)}</span>
                    </div>
                    <ul className="mt-2.5 space-y-1">
                      {o.items.map(i => (
                        <li key={i.uid} className="text-[13px] font-semibold text-purple-950/75 leading-snug">
                          <b className="text-purple-950">{i.qty}x {i.name}</b>
                          {i.extras.length > 0 && <span className="text-fuchsia-700"> (+ {i.extras.map(e => e.name).join(", ")})</span>}
                          {i.observation && <span className="block text-purple-500 italic pl-4">Obs: {i.observation}</span>}
                        </li>
                      ))}
                    </ul>
                    {o.note && <p className="mt-2 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-2.5 py-1.5">Obs. geral: {o.note}</p>}
                    <p className="text-[11px] font-bold text-purple-400 mt-2 uppercase tracking-wide">Pagamento: {o.payment}{o.status === "pronto" && o.callCount > 0 ? ` • Chamado ${o.callCount}x` : ""}</p>

                    <div className="mt-3">
                      {o.status === "finalizado" ? <button onClick={() => onRepeat(o)} className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-display font-extrabold flex items-center justify-center gap-2 cursor-pointer"><RotateCcw size={17} /> Repetir este pedido</button> : <button onClick={() => move(o)} className={`w-full h-11 rounded-xl font-display font-extrabold text-sm text-white flex items-center justify-center gap-1.5 cursor-pointer transition shadow ${o.status === "producao" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-purple-800 hover:bg-purple-700"}`}>
                        {o.status === "producao" ? <><BellRing size={17} /> Pronto e chamar</> : <><Check size={17} strokeWidth={3} /> Marcar como entregue</>}
                      </button>}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button onClick={() => setEditing(o)} title="Ver / editar pedido" className="w-11 h-11 grid place-items-center rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"><Pencil size={17} /></button>
                      <button onClick={() => printOrder(o, settings)} title="Imprimir cupom" className="w-11 h-11 grid place-items-center rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"><Printer size={17} /></button>
                      <button onClick={() => { if (confirm(`Excluir o pedido Nº ${pad(o.number)} de ${o.customer}?`)) deleteOrder(o.id); }} title="Excluir pedido" className="w-11 h-11 grid place-items-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer"><Trash2 size={17} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {editing && <EditOrderModal order={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { products, extras, updateOrder, deleteOrder, settings } = useShop();
  const [customer, setCustomer] = useState(order.customer);
  const [payment, setPayment] = useState(order.payment);
  const [type, setType] = useState(order.type);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.note);
  const [items, setItems] = useState(order.items);
  const [addId, setAddId] = useState("");
  const total = useMemo(() => orderTotal(items), [items]);

  const patchItem = (u: string, p: Partial<Order["items"][number]>) => setItems(items.map(i => i.uid === u ? { ...i, ...p } : i));
  const save = () => { updateOrder(order.id, { customer: customerName(customer), payment, type, status, note, items, total }); onClose(); };

  return (
    <div className="fixed inset-0 z-50 bg-purple-950/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-pop max-h-[92vh] overflow-y-auto nice-scroll" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 pt-5 pb-3 flex items-start justify-between border-b border-purple-100 z-10">
          <div>
            <h3 className="font-display font-black text-purple-950 text-2xl">Nº {pad(order.number)} · {order.customer}</h3>
            <p className="text-sm font-semibold text-purple-400">Criado às {fmtTime(order.createdAt)} • Rever, alterar ou corrigir itens</p>
          </div>
          <button onClick={onClose} className="bg-purple-50 rounded-full p-2 text-purple-700 cursor-pointer hover:bg-purple-100"><X size={18} /></button>
        </div>
        <div className="p-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Nome do cliente</span>
              <input value={customer} maxLength={80} placeholder="Cliente" onChange={e => setCustomer(e.target.value)} className="mt-1 w-full h-11 rounded-xl bg-purple-50/70 border-2 border-purple-100 px-3 font-bold text-purple-950 outline-none focus:border-purple-500" /></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Status</span>
              <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="mt-1 w-full h-11 rounded-xl bg-purple-50/70 border-2 border-purple-100 px-3 font-bold text-purple-950 outline-none focus:border-purple-500">
                <option value="producao">Em produção</option><option value="pronto">Pronto para entrega</option><option value="finalizado">Entregue</option>
              </select></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Pagamento</span>
              <select value={payment} onChange={e => setPayment(e.target.value)} className="mt-1 w-full h-11 rounded-xl bg-purple-50/70 border-2 border-purple-100 px-3 font-bold text-purple-950 outline-none focus:border-purple-500">
                <option>Pix</option><option>Cartão</option><option>Dinheiro</option>
              </select></label>
            <label className="block"><span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Tipo</span>
              <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full h-11 rounded-xl bg-purple-50/70 border-2 border-purple-100 px-3 font-bold text-purple-950 outline-none focus:border-purple-500">
                <option>Balcão</option><option>Retirada</option><option>Mesa</option><option>Delivery</option>
              </select></label>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-2">Itens do pedido</p>
            <ul className="space-y-2">
              {items.map(i => (
                <li key={i.uid} className="rounded-2xl border-2 border-purple-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-purple-950 leading-tight">{i.name}</p>
                      <p className="text-xs font-bold text-purple-400">{brl(i.unitPrice)} un.{i.extras.length ? ` • + ${i.extras.map(e => e.name).join(", ")}` : ""}</p>
                    </div>
                    <div className="flex items-center bg-purple-50 border border-purple-200 rounded-xl overflow-hidden">
                      <button onClick={() => patchItem(i.uid, { qty: Math.max(1, i.qty - 1) })} className="w-8 h-8 grid place-items-center text-purple-800 cursor-pointer"><Minus size={14} strokeWidth={3} /></button>
                      <span className="w-7 text-center font-extrabold text-purple-950 text-sm">{i.qty}</span>
                      <button onClick={() => patchItem(i.uid, { qty: i.qty + 1 })} className="w-8 h-8 grid place-items-center text-purple-800 cursor-pointer"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                    <span className="font-extrabold text-purple-900 w-20 text-right">{brl(itemTotal(i))}</span>
                    <button onClick={() => setItems(items.filter(x => x.uid !== i.uid))} className="text-red-500 hover:bg-red-50 rounded-lg p-1.5 cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                  <input value={i.observation} onChange={e => patchItem(i.uid, { observation: e.target.value })} placeholder="Observação deste item..."
                    className="mt-2 w-full h-9 rounded-lg bg-purple-50/60 border border-purple-100 px-2.5 text-[13px] font-semibold outline-none focus:border-purple-400" />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from(new Map([...extras.filter(e => e.active), ...i.extras].map(e => [e.id, e] as const)).values()).map(e => {
                      const has = i.extras.some(x => x.id === e.id);
                      return <button key={e.id} onClick={() => patchItem(i.uid, { extras: has ? i.extras.filter(x => x.id !== e.id) : [...i.extras, e] })} className={`px-2 h-7 rounded-full text-[11px] font-extrabold cursor-pointer ${has ? "bg-purple-800 text-white" : "bg-white text-purple-700 border border-purple-200"}`}>{e.name}</button>;
                    })}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <select value={addId} onChange={e => setAddId(e.target.value)} className="flex-1 h-11 rounded-xl bg-purple-50/70 border-2 border-purple-100 px-3 font-bold text-purple-950 outline-none">
                <option value="">Adicionar produto ao pedido...</option>
                {products.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} · {brl(p.price)}</option>)}
              </select>
              <button onClick={() => { const p = products.find(x => x.id === addId); if (p) { setItems([...items, { uid: uid(), productId: p.id, name: p.name, unitPrice: p.price, qty: 1, extras: [], observation: "" }]); setAddId(""); } }}
                className="h-11 px-4 rounded-xl bg-purple-800 text-white font-extrabold text-sm cursor-pointer flex items-center gap-1.5"><Plus size={16} strokeWidth={3} /> Item</button>
            </div>
          </div>

          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Observação geral do pedido..."
            className="w-full rounded-xl bg-purple-50/70 border-2 border-purple-100 p-3 text-sm font-semibold outline-none focus:border-purple-500 resize-none" />

          <div className="flex items-center justify-between bg-purple-950 rounded-2xl px-4 py-3">
            <span className="text-purple-200 font-bold text-sm">Total do pedido</span>
            <span className="font-display font-black text-amber-300 text-2xl">{brl(total)}</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { if (confirm(`Excluir definitivamente o pedido Nº ${pad(order.number)}?`)) { deleteOrder(order.id); onClose(); } }} className="h-12 px-4 rounded-2xl bg-red-50 text-red-600 font-extrabold text-sm cursor-pointer flex items-center gap-1.5"><Trash2 size={16} /> Excluir</button>
            <button onClick={() => printOrder({ ...order, customer, payment, type, note, items, total }, settings)} className="h-12 px-4 rounded-2xl bg-purple-50 text-purple-800 font-extrabold text-sm cursor-pointer flex items-center gap-1.5"><Printer size={16} /> Cupom</button>
            <button onClick={save} disabled={!items.length} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-purple-800 to-fuchsia-800 text-white font-display font-extrabold cursor-pointer disabled:opacity-40 shadow-lg shadow-purple-800/25">Salvar alterações</button>
          </div>
        </div>
      </div>
    </div>
  );
}
