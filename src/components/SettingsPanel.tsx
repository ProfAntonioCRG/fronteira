import { useState } from "react";
import { CheckCircle2, Database, HardDriveDownload, IceCreamBowl, MonitorPlay, Pencil, Plus, Printer, Save, Store, Trash2, X } from "lucide-react";
import { brl, uid, useShop, type Extra, type Product } from "../lib/shop";
import TvSettings from "./TvSettings";
import ReceiptSettingsPanel from "./ReceiptSettingsPanel";
import BackupSettings from "./BackupSettings";
import ResilientImage from "./ResilientImage";
import InstallationGuide from "./InstallationGuide";

export type SettingsTab = "loja" | "produtos" | "tv" | "impressao" | "backup" | "instalacao";
const TABS = [
  { id: "loja" as const, label: "Loja", icon: Store },
  { id: "produtos" as const, label: "Produtos e adicionais", icon: IceCreamBowl },
  { id: "tv" as const, label: "Tela da TV", icon: MonitorPlay },
  { id: "impressao" as const, label: "Impressão do cupom", icon: Printer },
  { id: "backup" as const, label: "Backup", icon: Database },
  { id: "instalacao" as const, label: "Instalação e offline", icon: HardDriveDownload },
];

const GRADIENTS = [
  "from-violet-700 via-purple-800 to-fuchsia-950", "from-pink-700 via-purple-800 to-purple-950",
  "from-amber-800 via-purple-900 to-purple-950", "from-rose-700 via-purple-900 to-purple-950",
  "from-sky-600 via-blue-900 to-purple-950", "from-emerald-700 via-teal-900 to-purple-950",
  "from-orange-700 via-amber-900 to-black", "from-indigo-700 via-purple-900 to-black",
];

const inputCls = "w-full h-11 rounded-xl bg-purple-50/70 border-2 border-purple-100 px-3 font-semibold text-purple-950 outline-none focus:border-purple-500 text-sm";
const labelCls = "text-xs font-extrabold uppercase tracking-wider text-purple-400 block mb-1";

export default function SettingsPanel({ tab, onTabChange }: { tab: SettingsTab; onTabChange: (tab: SettingsTab) => void }) {
  const shop = useShop();
  const { products, setProducts, extras, setExtras, settings, setSettings, orders, nextNumber, storageError } = shop;
  const [editing, setEditing] = useState<Product | null>(null);
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const minimumNumber = orders.reduce((maximum, order) => Math.max(maximum, order.number + 1), 1);

  return (
    <div className="space-y-4">
      <nav className="settings-tabs nice-scroll" aria-label="Categorias de configuração">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={tab === id} onClick={() => onTabChange(id)} className={tab === id ? "active" : ""}><Icon size={18} />{label}</button>)}
      </nav>
      <p className="settings-autosave"><CheckCircle2 size={14} /> {storageError ? "Verifique o aviso de armazenamento antes de fechar." : "Dados neste navegador. O contato do WhatsApp é aplicado ao clicar em Salvar."}</p>
      {/* Loja */}
      {tab === "loja" && <section className="bg-white rounded-3xl border-2 border-purple-100 shadow-sm p-5">
        <h3 className="font-display font-extrabold text-purple-950 text-xl mb-1">Dados da loja</h3>
        <p className="text-sm font-semibold text-purple-400 mb-4">Estas informações identificam sua loja na tela e no cupom.</p>
        <div className="grid md:grid-cols-3 gap-3">
          <label><span className={labelCls}>Nome da loja</span><input className={inputCls} value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value.toUpperCase() })} /></label>
          <label><span className={labelCls}>Slogan</span><input className={inputCls} value={settings.tagline} onChange={e => setSettings({ ...settings, tagline: e.target.value })} /></label>
          <label><span className={labelCls}>Telefone / WhatsApp</span><input className={inputCls} value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} /></label>
          <label className="md:col-span-2"><span className={labelCls}>Endereço (vai no cupom)</span><input className={inputCls} value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} /></label>
          <label><span className={labelCls}>Próximo número de pedido</span><input type="number" min={minimumNumber} className={inputCls} value={nextNumber} onChange={e => setSettings({ ...settings, nextNumber: Math.max(minimumNumber, Number(e.target.value) || minimumNumber) })} /><span className="settings-help">Números já utilizados não são repetidos.</span></label>
        </div>
      </section>}

      {tab === "tv" && <TvSettings />}
      {tab === "impressao" && <ReceiptSettingsPanel />}

      {/* Produtos */}
      {tab === "produtos" && <>
      <section className="bg-white rounded-3xl border-2 border-purple-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <h3 className="font-display font-extrabold text-purple-950 text-xl">Produtos (botões do atendimento)</h3>
            <p className="text-sm font-semibold text-purple-400">Altere nome, preço e descrição. Desative para esconder sem excluir.</p>
          </div>
          <button onClick={() => setEditing({ id: uid(), name: "", description: "", price: 0, category: "Açaí", active: true, image: "", gradient: GRADIENTS[0] })}
            className="ml-auto h-11 px-4 rounded-xl bg-purple-800 hover:bg-purple-700 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer"><Plus size={17} strokeWidth={3} /> Novo produto</button>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {products.map(p => (
            <div key={p.id} className={`rounded-2xl border-2 p-3 flex gap-3 ${p.active ? "border-purple-100 bg-white" : "border-purple-100 bg-purple-50/50 opacity-60"}`}>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${p.gradient} overflow-hidden shrink-0`}>
                {p.image && <ResilientImage src={p.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-purple-950 leading-tight truncate">{p.name}</p>
                <p className="text-xs font-bold text-purple-400">{p.category} • <span className="text-purple-800 text-sm">{brl(p.price)}</span></p>
                <p className="text-xs text-purple-950/50 font-medium line-clamp-1">{p.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button onClick={() => setEditing(p)} className="h-8 px-3 rounded-lg bg-purple-800 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"><Pencil size={12} /> Editar</button>
                  <button onClick={() => setProducts(products.map(x => x.id === p.id ? { ...x, active: !x.active } : x))} className={`h-8 px-3 rounded-lg text-xs font-extrabold cursor-pointer ${p.active ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{p.active ? "Desativar" : "Ativar"}</button>
                  <button onClick={() => { if (confirm(`Excluir o produto "${p.name}"?`)) setProducts(products.filter(x => x.id !== p.id)); }} className="h-8 w-8 grid place-items-center rounded-lg bg-red-50 text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adicionais */}
      <section className="bg-white rounded-3xl border-2 border-purple-100 shadow-sm p-5">
        <h3 className="font-display font-extrabold text-purple-950 text-xl">Adicionais / complementos</h3>
        <p className="text-sm font-semibold text-purple-400 mb-4">Aparecem ao personalizar cada produto do pedido.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {extras.map(e => (
            <span key={e.id} className={`inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-extrabold ${e.active ? "bg-purple-800 text-white" : "bg-purple-100 text-purple-400"}`}>
              {e.name} • {brl(e.price)}
              <button onClick={() => setExtras(extras.map(x => x.id === e.id ? { ...x, active: !x.active } : x))} className="bg-white/20 hover:bg-white/35 rounded-full px-2 py-0.5 text-[11px] cursor-pointer">{e.active ? "desativar" : "ativar"}</button>
              <button onClick={() => setExtras(extras.filter(x => x.id !== e.id))} className="bg-white/20 hover:bg-red-400 rounded-full p-1 cursor-pointer"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={extraName} onChange={e => setExtraName(e.target.value)} placeholder="Nome do adicional (ex.: Kit Kat)" className={`${inputCls} flex-1 min-w-52`} />
          <input value={extraPrice} onChange={e => setExtraPrice(e.target.value)} placeholder="Preço (ex.: 4,50)" inputMode="decimal" className={`${inputCls} w-40`} />
          <button onClick={() => { const v = Number(extraPrice.replace(",", ".")); if (extraName.trim() && extraPrice.trim() && Number.isFinite(v) && v >= 0) { setExtras([...extras, { id: uid(), name: extraName.trim(), price: v, active: true }]); setExtraName(""); setExtraPrice(""); } else { alert("Informe um nome e um preço válido, igual ou maior que zero."); } }}
            className="h-11 px-4 rounded-xl bg-purple-800 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer"><Plus size={16} strokeWidth={3} /> Adicionar</button>
        </div>
      </section>
      </>}

      {/* Dados */}
      {tab === "backup" && <BackupSettings />}
      {tab === "instalacao" && <InstallationGuide />}

      {editing && <ProductModal product={editing} onClose={() => setEditing(null)} onSave={(p) => {
        setProducts(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
        setEditing(null);
      }} />}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const { products } = useShop();
  const [p, setP] = useState<Product>(product);
  const [priceTxt, setPriceTxt] = useState(String(product.price).replace(".", ","));
  const cats = Array.from(new Set([...products.map(x => x.category), "Açaí", "Combos", "Doces", "Bebidas"]));
  const save = () => {
    const value = priceTxt.includes(",") ? priceTxt.replace(/\./g, "").replace(",", ".") : priceTxt;
    const price = Number(value);
    if (!p.name.trim() || !priceTxt.trim() || !Number.isFinite(price) || price < 0) { alert("Informe o nome e um preço válido, igual ou maior que zero."); return; }
    onSave({ ...p, name: p.name.trim(), price: Math.round(price * 100) / 100 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-purple-950/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-pop max-h-[92vh] overflow-y-auto nice-scroll" onClick={e => e.stopPropagation()}>
        <div className={`h-28 bg-gradient-to-br ${p.gradient} relative overflow-hidden`}>
          {p.image && <ResilientImage src={p.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-2 cursor-pointer"><X size={17} /></button>
          <p className="absolute bottom-3 left-5 font-display font-black text-white text-2xl drop-shadow">{p.name || "Novo produto"}</p>
        </div>
        <div className="p-5 space-y-3">
          <label className="block"><span className={labelCls}>Nome do produto *</span><input className={inputCls} value={p.name} onChange={e => setP({ ...p, name: e.target.value })} placeholder="Ex.: Açaí 500ml" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className={labelCls}>Preço (R$) *</span><input className={inputCls} value={priceTxt} onChange={e => setPriceTxt(e.target.value)} inputMode="decimal" placeholder="19,90" /></label>
            <label className="block"><span className={labelCls}>Categoria</span>
              <select className={inputCls} value={p.category} onChange={e => setP({ ...p, category: e.target.value })}>{cats.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <label className="block"><span className={labelCls}>Descrição (aparece no botão)</span><textarea rows={2} className={`${inputCls} h-auto py-2.5 resize-none`} value={p.description} onChange={e => setP({ ...p, description: e.target.value })} placeholder="Ex.: Açaí cremoso com banana e granola" /></label>
          <label className="block"><span className={labelCls}>Selo (opcional)</span><input className={inputCls} value={p.tag || ""} onChange={e => setP({ ...p, tag: e.target.value || undefined })} placeholder="Ex.: Mais pedido, Novo, Da casa" /></label>
          <label className="block"><span className={labelCls}>Foto (endereço da imagem - opcional)</span><input className={inputCls} value={p.image} onChange={e => setP({ ...p, image: e.target.value })} placeholder="https://... ou deixe vazio para usar só a cor" /></label>
          <div>
            <span className={labelCls}>Cor do botão</span>
            <div className="flex gap-2 flex-wrap">{GRADIENTS.map(g => <button key={g} onClick={() => setP({ ...p, gradient: g })} className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} cursor-pointer ${p.gradient === g ? "ring-4 ring-amber-400 scale-110" : "ring-1 ring-purple-100"}`} />)}</div>
          </div>
          <label className="flex items-center gap-2.5 font-bold text-purple-900 text-sm cursor-pointer">
            <input type="checkbox" checked={p.active} onChange={e => setP({ ...p, active: e.target.checked })} className="w-5 h-5 accent-purple-800" /> Produto visível no atendimento
          </label>
          <button onClick={save} className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-800 to-fuchsia-800 text-white font-display font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-800/25"><Save size={18} /> Salvar produto</button>
        </div>
      </div>
    </div>
  );
}

export type { Extra };
