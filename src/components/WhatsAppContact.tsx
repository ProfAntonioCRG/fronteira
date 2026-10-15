import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Copy, Download, ExternalLink, MessageCircle, QrCode, Save } from "lucide-react";
import { useShop } from "../lib/shop";
import { DEFAULT_WHATSAPP, normalizeWhatsApp, whatsAppContact, type WhatsAppSettings } from "../lib/whatsapp";

function ContactQr({ value, size = 200 }: { value: string; size?: number }) {
  return <QRCodeSVG value={value} size={size} level="M" marginSize={4} bgColor="#ffffff" fgColor="#160b1d" title="Escaneie para conversar com a loja no WhatsApp" />;
}

export function WhatsAppTvContact() {
  const { settings } = useShop();
  const contact = whatsAppContact(settings.whatsapp);
  if (!settings.whatsapp.enabled || !contact.valid) return null;
  return <aside className={`tv-whatsapp ${settings.whatsapp.size === "large" ? "tv-whatsapp-large" : ""}`} aria-label="Contato da loja pelo WhatsApp">
    <a className="tv-whatsapp-code" href={contact.link} target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp da loja"><ContactQr value={contact.link} size={settings.whatsapp.size === "large" ? 192 : 156} /></a>
    <div className="tv-whatsapp-copy">
      <span><MessageCircle size={16} /> WhatsApp</span>
      <h2>{settings.whatsapp.caption.trim() || DEFAULT_WHATSAPP.caption}</h2>
      <p>Aponte a câmera do celular.</p>
      <strong>{contact.formatted}</strong>
    </div>
  </aside>;
}

export default function WhatsAppSettingsPanel() {
  const { settings, setSettings, storageError } = useShop();
  const [draft, setDraft] = useState(settings.whatsapp);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const qr = useRef<HTMLDivElement>(null);
  const stored = JSON.stringify(settings.whatsapp);
  useEffect(() => { setDraft(JSON.parse(stored) as WhatsAppSettings); setError(""); setTouched(false); }, [stored]);
  const contact = whatsAppContact(draft);
  const dirty = JSON.stringify(draft) !== stored;

  const update = (patch: Partial<WhatsAppSettings>) => { setDraft(current => ({ ...current, ...patch })); setMessage(""); setError(""); };
  const save = () => {
    setTouched(true); setMessage("");
    if ((draft.enabled || draft.phone.trim()) && !contact.valid) { setError(contact.error); return; }
    const value = normalizeWhatsApp({ ...draft, phone: draft.phone.trim(), countryCode: draft.countryCode.trim(), message: draft.message.trim(), caption: draft.caption.trim() || DEFAULT_WHATSAPP.caption });
    setSettings(current => ({ ...current, whatsapp: value }));
    setError("");
    setMessage(value.enabled ? "Contato salvo. O QR Code aparece no rodapé da TV, sem cobrir as imagens nem as chamadas." : "Contato salvo. O QR Code está oculto no painel da TV.");
  };
  const download = () => {
    const element = qr.current?.querySelector("svg");
    if (!element || !contact.valid) return;
    const svg = element.cloneNode(true) as SVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "800"); svg.setAttribute("height", "800");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "fronteira-whatsapp-qrcode.svg"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("QR Code baixado em SVG. Você pode usar o arquivo nos seus cardápios.");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(contact.link); setMessage("Link copiado para compartilhar."); setError(""); }
    catch { setError("Não foi possível copiar automaticamente. Selecione o link na prévia e copie manualmente."); }
  };

  return <div className="whatsapp-settings">
    <div className="whatsapp-intro"><div className="whatsapp-symbol"><MessageCircle size={25} /></div><div><h3>Um contato que o cliente leva com ele</h3><p>Cadastre o WhatsApp da loja e deixe o QR Code disponível na tela da TV.</p></div></div>
    <div className="whatsapp-settings-grid">
      <div className="whatsapp-fields">
        <label className="settings-toggle whatsapp-enable"><span>Mostrar QR Code no painel da TV<small>O contato fica ao lado das últimas chamadas.</small></span><input type="checkbox" checked={draft.enabled} onChange={event => update({ enabled: event.target.checked })} /></label>
        <div className="whatsapp-phone-fields">
          <label className="field-label">DDI do país<input className="form-input" type="tel" inputMode="numeric" autoComplete="tel-country-code" maxLength={4} placeholder="55" value={draft.countryCode} onChange={event => update({ countryCode: event.target.value })} onBlur={() => setTouched(true)} /></label>
          <label className="field-label">DDD + número do WhatsApp<input className="form-input" type="tel" autoComplete="tel-national" maxLength={32} placeholder="(11) 99999-9999" value={draft.phone} onChange={event => update({ phone: event.target.value })} onBlur={() => setTouched(true)} aria-invalid={touched && !contact.valid} aria-describedby="whatsapp-phone-help" /></label>
        </div>
        <p id="whatsapp-phone-help" className="settings-help">Para o Brasil, use DDI 55 e informe o DDD junto do telefone. O número deve ter uma conta ativa no WhatsApp.</p>
        <label className="field-label">Frase ao lado do QR Code<input className="form-input" maxLength={64} value={draft.caption} onChange={event => update({ caption: event.target.value })} placeholder={DEFAULT_WHATSAPP.caption} /></label>
        <label className="field-label">Mensagem inicial (opcional)<textarea className="form-input" rows={2} maxLength={120} value={draft.message} onChange={event => update({ message: event.target.value })} placeholder="Ex.: Olá! Vi o cardápio na TV e quero saber mais." /><span className="settings-help">Só é enviada quando o cliente confirmar no WhatsApp. Prefira uma mensagem curta ou deixe vazia para facilitar a leitura do QR Code à distância.</span></label>
        <label className="field-label">Tamanho na TV<select className="form-input" value={draft.size} onChange={event => update({ size: event.target.value as "normal" | "large" })}><option value="normal">Padrão</option><option value="large">Maior (mais fácil de ler à distância)</option></select></label>
        {(error || storageError || (touched && !contact.valid && !!draft.phone.trim())) && <p className="feedback error" role="alert">{error || storageError || contact.error}</p>}
        {message && !storageError && <p className="feedback success" role="status"><CheckCircle2 size={17} />{message}</p>}
        <div className="whatsapp-save"><button className="action-button primary" onClick={save}><Save size={17} /> Salvar contato e exibição</button><span>{dirty ? "Alterações ainda não salvas" : "Configuração atual"}</span></div>
        <p className="settings-help">O QR Code é gerado aqui, sem serviço externo e sem mensalidade. Pode ficar na TV mesmo com o computador offline. O celular do cliente precisa de internet para abrir a conversa.</p>
      </div>
      <div className="whatsapp-preview">
        <p className="preview-caption">PRÉVIA DO CONTATO<span>{draft.enabled ? "Visível na TV após salvar" : "Oculto na TV"}</span></p>
        <div className="whatsapp-preview-code" ref={qr}>{contact.valid ? <ContactQr value={contact.link} size={228} /> : <div className="whatsapp-empty-qr"><QrCode size={58} strokeWidth={1.3} /><span>Informe o número<br />para gerar seu QR Code.</span></div>}</div>
        <span className="whatsapp-preview-brand"><MessageCircle size={17} /> WhatsApp</span>
        <h4>{draft.caption.trim() || DEFAULT_WHATSAPP.caption}</h4>
        {contact.valid ? <>
          <p className="whatsapp-preview-number">{contact.formatted}</p>
          <a className="action-button whatsapp-test" href={contact.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Testar conversa</a>
          <div className="whatsapp-preview-actions"><button onClick={download}><Download size={15} /> Baixar QR Code</button><button onClick={() => void copy()}><Copy size={15} /> Copiar link</button></div>
          <input className="whatsapp-link" value={contact.link} readOnly aria-label="Link de WhatsApp gerado" onFocus={event => event.target.select()} />
        </> : <p className="settings-help">Nenhum número de exemplo será publicado.</p>}
        <p className="settings-help">Antes de usar, escaneie com seu celular e confira se a conversa abre com o contato correto.</p>
      </div>
    </div>
  </div>;
}