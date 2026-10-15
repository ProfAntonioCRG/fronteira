import { useRef, useState } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useShop } from "../lib/shop";
import { parseBackup } from "../lib/backup";

export default function BackupSettings() {
  const { products, extras, orders, settings, tvSlides, mediaLoaded, mediaError, saveTvSlides, setProducts, setExtras, setOrders, setSettings, resetDefaults } = useShop();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const exportBackup = () => {
    if (mediaError && !confirm("Não foi possível ler as imagens da TV. Exportar os pedidos, produtos e configurações sem as imagens?")) return;
    const data = JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), products, extras, orders, settings, ...(mediaError ? {} : { tvSlides }) });
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fronteira-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setError(""); setMessage(mediaError ? "Backup gerado sem as imagens da TV. Produtos, pedidos e configurações foram incluídos." : "Backup gerado com produtos, pedidos, configuração do cupom e imagens da TV.");
  };

  const importBackup = async (file: File) => {
    setBusy(true); setMessage(""); setError("");
    try {
      if (file.size > 150 * 1024 * 1024) throw new Error("Este arquivo é muito grande. Selecione um backup de até 150 MB.");
      const data = parseBackup(await file.text());
      if (!confirm(`Importar ${data.orders.length} pedido(s), ${data.products.length} produto(s)${data.tvSlides ? ` e ${data.tvSlides.length} imagem(ns)` : ""}? Os dados atuais serão substituídos. Faça um backup antes de continuar.`)) return;
      if (data.tvSlides) await saveTvSlides(data.tvSlides);
      setProducts(data.products); setExtras(data.extras); setOrders(data.orders); setSettings(data.settings);
      setMessage("Backup importado. Pedidos antigos em análise foram movidos para produção.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível importar este backup."); }
    finally { setBusy(false); }
  };

  return <section className="settings-section">
    <div className="settings-section-heading"><div><h2>Uma cópia de tudo, por segurança</h2><p>Salve os pedidos, produtos, contato do WhatsApp, configurações e imagens da TV em um único arquivo.</p></div></div>
    <p className="settings-help mb-5">Os dados pertencem a este endereço e perfil de navegador. Limpar os dados do site também remove as imagens. Guarde um backup antes de trocar de computador, navegador ou endereço de publicação.</p>
    {message && <p className="feedback success" role="status">{message}</p>}
    {(error || mediaError) && <p className="feedback error" role="alert">{error || mediaError}</p>}
    <div className="flex flex-wrap gap-3">
      <button className="action-button primary" disabled={busy || !mediaLoaded} onClick={exportBackup}><Download size={18} /> Exportar backup completo</button>
      <button className="action-button secondary" disabled={busy || !mediaLoaded} onClick={() => input.current?.click()}><Upload size={18} /> {busy ? "Importando..." : "Importar backup"}</button>
      <input ref={input} className="hidden" type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; if (file) void importBackup(file); event.target.value = ""; }} />
    </div>
    <div className="backup-danger-zone">
      <h3>Manutenção dos dados</h3><p className="settings-help">Estas ações não podem ser desfeitas sem um backup.</p>
      <div className="flex flex-wrap gap-3 mt-4">
        <button className="action-button danger" disabled={busy} onClick={() => { if (confirm("Apagar TODOS os pedidos, inclusive os entregues? Exporte um backup antes de continuar.")) { setOrders([]); setMessage("Pedidos removidos. A numeração foi preservada."); } }}><Trash2 size={17} /> Limpar pedidos</button>
        <button className="action-button secondary" disabled={busy} onClick={() => { if (confirm("Restaurar produtos, adicionais e configurações da loja? Os pedidos e as imagens salvas da TV serão mantidos.")) { resetDefaults(); setMessage("Configurações padrão restauradas. Pedidos e imagens foram mantidos."); } }}><RotateCcw size={17} /> Restaurar padrão</button>
      </div>
    </div>
  </section>;
}