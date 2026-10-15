import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CheckCircle2, ClipboardList, CreditCard, IceCreamBowl, Minus, NotebookPen, Plus, Printer, QrCode, Search, SlidersHorizontal, Sparkles, Trash2, User, X } from "lucide-react";
import { brl, customerName, itemTotal, orderTotal, pad, uid, useShop, type Order, type OrderItem, type Product } from "../lib/shop";
import { printOrder } from "../lib/print";
import OrderConfirmation from "./OrderConfirmation";
import ResilientImage from "./ResilientImage";
import Modal from "./Modal";

const PAYMENTS = [
  { id: "Pix", icon: QrCode }, { id: "Cartão", icon: CreditCard }, { id: "Dinheiro", icon: Banknote },
];
const TYPES = ["Balcão", "Retirada", "Mesa", "Delivery"];

export interface RepeatRequest { key: string; order: Order; }

export default function Pos({ repeatRequest, onGoOrders }: { repeatRequest: RepeatRequest | null; onGoOrders: () => void }) {
  const { products, extras, orders, settings, nextNumber, createOrder, panelCount } = useShop();
  const [cat, setCat] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [customer, setCustomer] = useState("");
  const [type, setType] = useState("Balcão");
  const [payment, setPayment] = useState("Pix");
  const [note, setNote] = useState("");
  const [custom, setCustom] = useState<Product | null>(null);
  const [done, setDone] = useState<Order | null>(null);
  const [lastConfirmedId, setLastConfirmedId] = useState<string | null>(null);
  const customerInput = useRef<HTMLInputElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState<number | null>(null);
  const handledRepeat = useRef("");
  const submitting = useRef(false);
  const hasDraft = useRef(false);
  hasDraft.current = cart.length > 0;

  useEffect(() => {
    if (!repeatRequest || handledRepeat.current === repeatRequest.key) return;
    handledRepeat.current = repeatRequest.key;
    if (hasDraft.current && !window.confirm("Substituir o pedido em revisão pela cópia do pedido entregue?")) return;
    const original = repeatRequest.order;
    setCart(original.items.map(item => ({ ...item, uid: uid(), extras: item.extras.map(extra => ({ ...extra })) })));
    setCustomer(original.customer); setPayment(original.payment); setType(original.type); setNote(original.note);
    setSelectedUid(null); setDone(null); setReviewing(false); setCopiedFrom(original.number);
    submitting.current = false;
  }, [repeatRequest]);

  const cats = useMemo(() => ["Todos", ...Array.from(new Set(products.filter(p => p.active).map(p => p.category)))], [products]);
  const visible = products.filter(p => p.active && (cat === "Todos" || p.category === cat) && (p.name + p.description).toLowerCase().includes(search.toLowerCase()));
  const total = orderTotal(cart);
  const baseTotal = cart.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.qty, 0) / 100;
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const selected = cart.find(i => i.uid === selectedUid) || cart[cart.length - 1];
  const selectedExtras = Array.from(new Map([...extras.filter(extra => extra.active), ...(selected?.extras || [])].map(extra => [extra.id, extra] as const)).values());
  const lastConfirmed = orders.find(order => order.id === lastConfirmedId);

  const addQuick = (p: Product) => {
    const existing = cart.find(i => i.productId === p.id && i.extras.length === 0 && !i.observation);
    if (existing) {
      setCart(cart.map(i => i.uid === existing.uid ? { ...i, qty: i.qty + 1 } : i));
      setSelectedUid(existing.uid);
    } else {
      const item: OrderItem = { uid: uid(), productId: p.id, name: p.name, unitPrice: p.price, qty: 1, extras: [], observation: "" };
      setCart([...cart, item]); setSelectedUid(item.uid);
    }
  };

  const patchItem = (u: string, patch: Partial<OrderItem>) => setCart(c => c.map(i => i.uid === u ? { ...i, ...patch } : i));
  const toggleExtra = (item: OrderItem, e: { id: string; name: string; price: number }) => {
    const has = item.extras.some(x => x.id === e.id);
    patchItem(item.uid, { extras: has ? item.extras.filter(x => x.id !== e.id) : [...item.extras, e] });
  };

  const confirmOrder = (shouldPrint: boolean) => {
    if (!cart.length || submitting.current) return;
    submitting.current = true;
    const order = createOrder({
      customer: customerName(customer), type, payment, items: cart, note: note.trim(),
      total, status: "producao",
    });
    setReviewing(false);
    setDone(order);
    setLastConfirmedId(order.id);
    setCart([]); setCustomer(""); setNote(""); setSelectedUid(null); setCopiedFrom(null);
    if (shouldPrint) printOrder(order, settings);
  };

  const resetSale = () => { setCart([]); setCustomer(""); setNote(""); setSelectedUid(null); setDone(null); setReviewing(false); setCopiedFrom(null); submitting.current = false; };
  const closeSavedOrder = () => { setDone(null); submitting.current = false; };
  const startNextOrder = () => {
    closeSavedOrder();
    setTimeout(() => customerInput.current?.focus(), 0);
  };
  const draft: Order = {
    id: "draft", number: nextNumber, customer: customerName(customer), type, payment,
    items: cart, note: note.trim(), total, status: "producao", createdAt: Date.now(), updatedAt: Date.now(), callCount: 0,
  };

  return (
    <div className="pos-layout">
      {/* Produtos */}
      <section className="pos-catalog" aria-label="Produtos disponíveis">
        <div className="pos-toolbar">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
              className="w-full h-13 rounded-2xl bg-white border-2 border-purple-100 pl-11 pr-4 text-base font-semibold text-purple-950 outline-none focus:border-purple-500 shadow-sm" />
          </div>
          <div className="pos-categories nice-scroll">{cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`h-10 px-4 rounded-xl font-display font-bold text-base transition-all cursor-pointer whitespace-nowrap ${cat === c ? "bg-purple-800 text-white shadow-sm" : "bg-white text-purple-900 border border-purple-100 hover:border-purple-300"}`}>
              {c}
            </button>
          ))}</div>
          {lastConfirmed && <div className="last-confirmed-order"><span>Último: <strong>Nº {pad(lastConfirmed.number)} · {lastConfirmed.customer}</strong></span><button onClick={() => printOrder(lastConfirmed, settings)}><Printer size={14} /> Reimprimir</button></div>}
        </div>

        <div className="pos-products-scroll nice-scroll"><div className="pos-products-grid">
          {visible.map(p => (
            <div key={p.id} className="group relative rounded-3xl overflow-hidden bg-white border-2 border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-purple-300 transition-all text-left">
              <button onClick={() => addQuick(p)} className="block w-full text-left cursor-pointer" title="Toque para adicionar">
                <div className={`h-24 bg-gradient-to-br ${p.gradient} relative overflow-hidden`}>
                  {p.image && <ResilientImage src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  {p.tag && <span className="absolute top-2 left-2 bg-amber-400 text-purple-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1"><Sparkles size={11} />{p.tag}</span>}
                  <span className="absolute bottom-2 right-2 bg-white text-purple-900 font-display font-extrabold text-lg px-3 py-1 rounded-xl shadow">{brl(p.price)}</span>
                  <span className="absolute bottom-2 left-2 bg-purple-950/80 text-white rounded-full p-2 backdrop-blur"><Plus size={18} strokeWidth={3} /></span>
                </div>
                <div className="p-3.5 pb-2">
                  <h3 className="font-display font-extrabold text-purple-950 text-lg leading-tight">{p.name}</h3>
                  <p className="text-[13px] text-purple-950/55 font-medium leading-snug mt-1 line-clamp-2 min-h-9">{p.description}</p>
                </div>
              </button>
              <button onClick={() => setCustom(p)} className="mx-3.5 mb-3.5 w-[calc(100%-1.75rem)] h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer">
                <SlidersHorizontal size={16} /> Personalizar
              </button>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl border-2 border-dashed border-purple-200 p-12 text-center text-purple-400 font-bold">
              <IceCreamBowl size={40} className="mx-auto mb-3 opacity-50" /> Nenhum produto encontrado nesta categoria.
            </div>
          )}
        </div></div>
      </section>

      {/* Pedido atual */}
      <aside className="pos-review" aria-label="Revisão e valores do pedido">
        <div className="review-heading bg-gradient-to-r from-purple-950 via-purple-900 to-fuchsia-950">
          <div>
            <h2 className="font-display font-extrabold text-white text-xl leading-none">Revisão do pedido</h2>
            <p className="text-purple-200 text-xs font-semibold mt-1">Nº {pad(nextNumber)} · {customerName(customer)}</p>
          </div>
          <button onClick={() => { if (cart.length && window.confirm("Limpar os itens deste pedido?")) resetSale(); }} disabled={!cart.length} title="Limpar pedido atual" aria-label="Limpar pedido atual" className="p-2.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-xl disabled:opacity-30 cursor-pointer"><Trash2 size={18} /></button>
        </div>
        <div className="review-customer">
          <label htmlFor="order-customer">Nome do cliente <span>opcional</span></label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
            <input ref={customerInput} id="order-customer" value={customer} onChange={e => setCustomer(e.target.value)} maxLength={80} autoComplete="off" placeholder="Cliente (ou digite o nome)" aria-describedby="customer-call-help"
              className="w-full h-12 rounded-xl bg-purple-50/70 border-2 border-purple-100 pl-10 pr-3 font-bold text-purple-950 outline-none focus:border-purple-500 placeholder:font-semibold placeholder:text-purple-400" />
          </div>
          <p id="customer-call-help">Chamamos pelo nome e número. Sem nome, usamos <strong>Cliente</strong>.</p>
        </div>

        <div className="review-scroll nice-scroll">
          {copiedFrom !== null && <p className="copy-notice">Cópia do pedido Nº {pad(copiedFrom)}. Os itens e preços originais foram mantidos: revise antes de confirmar. O pedido entregue não será alterado.</p>}
          <div className="grid grid-cols-4 gap-1.5">
            {TYPES.map(t => <button key={t} onClick={() => setType(t)} className={`h-10 rounded-lg text-[13px] font-extrabold cursor-pointer transition ${type === t ? "bg-purple-800 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}>{t}</button>)}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENTS.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setPayment(id)} className={`h-11 rounded-lg text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${payment === id ? "bg-amber-400 text-purple-950" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}><Icon size={17} />{id}</button>
            ))}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 py-8 text-center text-purple-400 font-bold text-sm px-4">
              Toque nos produtos ao lado para montar o pedido. É rápido: um toque = um item.
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map(i => (
                <li key={i.uid} onClick={() => setSelectedUid(i.uid)}
                  className={`rounded-2xl border-2 p-3 cursor-pointer transition ${selected?.uid === i.uid ? "border-purple-500 bg-purple-50/80" : "border-purple-100 bg-white hover:border-purple-200"}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-purple-950 leading-tight">{i.name}</p>
                      <p className="text-xs text-purple-500 font-bold">{brl(i.unitPrice)} un.</p>
                      {i.extras.length > 0 && <p className="text-xs text-fuchsia-700 font-semibold mt-0.5">+ {i.extras.map(e => e.name).join(", ")}</p>}
                    </div>
                    <span className="font-display font-extrabold text-purple-900">{brl(itemTotal(i))}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="flex items-center bg-white border-2 border-purple-200 rounded-xl overflow-hidden">
                      <button onClick={e => { e.stopPropagation(); patchItem(i.uid, { qty: Math.max(1, i.qty - 1) }); }} className="w-9 h-9 grid place-items-center text-purple-800 hover:bg-purple-100 cursor-pointer"><Minus size={16} strokeWidth={3} /></button>
                      <span className="w-8 text-center font-extrabold text-purple-950">{i.qty}</span>
                      <button onClick={e => { e.stopPropagation(); patchItem(i.uid, { qty: i.qty + 1 }); }} className="w-9 h-9 grid place-items-center text-purple-800 hover:bg-purple-100 cursor-pointer"><Plus size={16} strokeWidth={3} /></button>
                    </div>
                    <input value={i.observation} onClick={e => e.stopPropagation()} onChange={e => patchItem(i.uid, { observation: e.target.value })}
                      placeholder="Obs. deste item..." className="flex-1 min-w-0 h-9 rounded-lg bg-white border border-purple-200 px-2.5 text-[13px] font-semibold outline-none focus:border-purple-500 placeholder:text-purple-300" />
                    <button onClick={e => { e.stopPropagation(); setCart(cart.filter(x => x.uid !== i.uid)); }} className="w-9 h-9 grid place-items-center rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={17} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selected && cart.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-3">
              <details><summary className="text-xs font-extrabold text-amber-800 cursor-pointer"><NotebookPen size={13} className="inline mr-1" /> Adicionais de {selected.name}</summary>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {selectedExtras.map(e => {
                  const has = selected.extras.some(x => x.id === e.id);
                  return <button key={e.id} onClick={() => toggleExtra(selected, e)} className={`px-2.5 h-8 rounded-full text-xs font-extrabold cursor-pointer transition ${has ? "bg-purple-800 text-white" : "bg-white text-purple-800 border border-purple-200 hover:border-purple-400"}`}>{e.name} +{brl(e.price)}</button>;
                })}
              </div></details>
            </div>
          )}

          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Observação geral do pedido..." aria-label="Observação geral do pedido"
            className="w-full rounded-xl bg-purple-50/70 border-2 border-purple-100 p-3 text-sm font-semibold text-purple-950 outline-none focus:border-purple-500 resize-none placeholder:text-purple-300" />
        </div>
        <footer className="review-totals">
          <div className="review-subtotal"><span>Produtos ({itemCount} {itemCount === 1 ? "item" : "itens"})</span><strong>{brl(baseTotal)}</strong></div>
          <div className="review-subtotal"><span>Adicionais</span><strong>{brl(total - baseTotal)}</strong></div>
          <div className="review-grand-total" aria-live="polite"><span>Total do pedido</span><strong>{brl(total)}</strong></div>
          <button onClick={() => setReviewing(true)} disabled={!cart.length} className="review-confirm-button"><CheckCircle2 size={21} /> Revisar e confirmar</button>
          <p>Confira com o cliente antes de imprimir.</p>
        </footer>
      </aside>

      {custom && <CustomizeModal product={custom} onClose={() => setCustom(null)} onAdd={(item) => { setCart(c => [...c, item]); setSelectedUid(item.uid); setCustom(null); }} />}
      {reviewing && <OrderConfirmation order={draft} onClose={() => setReviewing(false)} onConfirm={confirmOrder} />}
      {done && (
        <Modal label="Pedido confirmado" className="order-saved-modal" onClose={closeSavedOrder}>
          <button className="icon-action saved-order-close" aria-label="Fechar confirmação do pedido" onClick={closeSavedOrder}><X size={20} /></button>
          <div className="saved-order-content">
            <span className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-600 grid place-items-center mb-3"><CheckCircle2 size={36} /></span>
            <p className="font-bold text-purple-400 uppercase tracking-widest text-xs">Pedido confirmado</p>
            <p className="font-display font-black text-purple-950 text-6xl my-2">Nº {pad(done.number)}</p>
            <p className="font-extrabold text-purple-900 text-lg">{done.customer}</p>
            <p className="text-purple-500 font-semibold text-sm">{done.items.reduce((s, i) => s + i.qty, 0)} itens • {brl(done.total)} • {done.payment}</p>
            <div className="saved-order-actions">
              <button onClick={startNextOrder} className="action-button primary"><Plus size={18} /> Novo pedido</button>
              <button onClick={() => printOrder(done, settings)} className="action-button gold"><Printer size={18} /> Reimprimir pedido</button>
            </div>
            <button className="action-button secondary saved-order-view" onClick={() => { closeSavedOrder(); onGoOrders(); }}><ClipboardList size={17} /> Ver pedidos em produção</button>
            <button className="text-action" onClick={closeSavedOrder}>Voltar ao atendimento</button>
            <p className="saved-order-hint">Pedido salvo em produção. Na TV ele aparece em preparo. Quando estiver pronto, use <strong>Pronto e chamar</strong> na aba Pedidos.</p>
            {!panelCount && <p className="saved-order-warning">A TV não está conectada. Abra o painel pelo botão Painel da TV no menu.</p>}
            <p className="saved-order-footnote">Fechar esta janela não exclui nem duplica o pedido. Você também pode usar Esc.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CustomizeModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (i: OrderItem) => void }) {
  const { extras } = useShop();
  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState<OrderItem["extras"]>([]);
  const [obs, setObs] = useState("");
  const total = (product.price + sel.reduce((s, e) => s + e.price, 0)) * qty;
  return (
    <div className="fixed inset-0 z-50 bg-purple-950/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-pop max-h-[92vh] overflow-y-auto nice-scroll" onClick={e => e.stopPropagation()}>
        <div className={`h-32 bg-gradient-to-br ${product.gradient} relative`}>
          {product.image && <ResilientImage src={product.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-75" />}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-2 cursor-pointer hover:bg-black/60"><X size={18} /></button>
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-display font-black text-white text-2xl drop-shadow">{product.name}</h3>
            <p className="text-white/85 text-sm font-semibold drop-shadow">{product.description}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-2">Adicionais</p>
            <div className="flex flex-wrap gap-2">
              {extras.filter(e => e.active).map(e => {
                const has = sel.some(x => x.id === e.id);
                return <button key={e.id} onClick={() => setSel(has ? sel.filter(x => x.id !== e.id) : [...sel, e])} className={`px-3 h-10 rounded-full text-sm font-extrabold cursor-pointer transition ${has ? "bg-purple-800 text-white shadow" : "bg-purple-50 text-purple-800 border border-purple-200"}`}>{e.name} <span className="opacity-70">+{brl(e.price)}</span></button>;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-2">Observação do cliente</p>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Ex.: sem granola, bem caprichado no ninho..."
              className="w-full rounded-xl bg-purple-50/70 border-2 border-purple-100 p-3 text-sm font-semibold outline-none focus:border-purple-500 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-purple-50 border-2 border-purple-200 rounded-2xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-12 grid place-items-center text-purple-800 cursor-pointer"><Minus size={18} strokeWidth={3} /></button>
              <span className="w-9 text-center font-display font-extrabold text-xl text-purple-950">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-11 h-12 grid place-items-center text-purple-800 cursor-pointer"><Plus size={18} strokeWidth={3} /></button>
            </div>
            <button onClick={() => onAdd({ uid: uid(), productId: product.id, name: product.name, unitPrice: product.price, qty, extras: sel, observation: obs.trim() })}
              className="flex-1 h-13 py-3.5 rounded-2xl bg-gradient-to-r from-purple-800 to-fuchsia-800 text-white font-display font-extrabold text-base cursor-pointer shadow-lg shadow-purple-800/25">
              Adicionar • {brl(total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
