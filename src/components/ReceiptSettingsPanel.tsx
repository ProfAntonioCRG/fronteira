import { Printer } from "lucide-react";
import { useShop, type Order, type ReceiptSettings } from "../lib/shop";
import { printOrder, receiptDocument } from "../lib/print";

const EXAMPLE: Order = {
  id: "preview", number: 123, customer: "Maria Silva", type: "Balcão", payment: "Pix", note: "Colocar as colheres na embalagem.",
  items: [
    { uid: "preview-1", productId: "p1", name: "Açaí 500ml", unitPrice: 19.9, qty: 2, extras: [{ id: "ninho", name: "Leite Ninho", price: 4 }], observation: "Sem granola" },
    { uid: "preview-2", productId: "p2", name: "Brownie Recheado", unitPrice: 12.9, qty: 1, extras: [], observation: "" },
  ],
  total: 60.7, status: "producao", createdAt: Date.now(), updatedAt: Date.now(), callCount: 0,
};

const FIELDS: { key: Exclude<keyof ReceiptSettings, "paperWidth">; label: string }[] = [
  { key: "showLogo", label: "Logo da loja" },
  { key: "showCustomer", label: "Nome do cliente" },
  { key: "showAddress", label: "Endereço da loja" },
  { key: "showPhone", label: "Telefone / WhatsApp" },
  { key: "showDateTime", label: "Data e hora do pedido" },
  { key: "showOrderType", label: "Tipo de atendimento" },
  { key: "showPayment", label: "Forma de pagamento" },
  { key: "showExtras", label: "Adicionais dos produtos" },
  { key: "showNotes", label: "Observações do cliente" },
  { key: "showPrices", label: "Valores dos itens e total" },
  { key: "showFooter", label: "Mensagem no rodapé" },
];

export function ReceiptPreview({ order = EXAMPLE }: { order?: Order }) {
  const { settings } = useShop();
  return <iframe className="receipt-preview" title="Prévia do cupom de impressão" sandbox="" srcDoc={receiptDocument(order, settings)} />;
}

export default function ReceiptSettingsPanel() {
  const { settings, setSettings } = useShop();
  const update = (patch: Partial<ReceiptSettings>) => setSettings(current => ({ ...current, receipt: { ...current.receipt, ...patch } }));
  return (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div><h2>O que vai no cupom?</h2><p>Escolha as informações e confira o resultado antes de imprimir.</p></div>
        <button className="action-button secondary" onClick={() => printOrder(EXAMPLE, settings)}><Printer size={17} /> Imprimir teste</button>
      </div>
      <div className="receipt-settings-grid">
        <div className="space-y-5">
          <label className="field-label">Largura do papel
            <select className="form-input" value={settings.receipt.paperWidth} onChange={event => update({ paperWidth: event.target.value as "58" | "80" })}>
              <option value="80">80 mm (padrão)</option><option value="58">58 mm (compacto)</option>
            </select>
          </label>
          <div className="settings-toggle-list">
            {FIELDS.map(field => <label className="settings-toggle" key={field.key}>
              <span>{field.label}</span><input type="checkbox" checked={settings.receipt[field.key]} onChange={event => update({ [field.key]: event.target.checked })} />
            </label>)}
          </div>
          <label className="field-label">Mensagem de agradecimento
            <textarea className="form-input" rows={3} value={settings.receiptFooter} onChange={event => setSettings(current => ({ ...current, receiptFooter: event.target.value }))} />
          </label>
          <p className="settings-help">O número do pedido e os produtos sempre são impressos. Os dados da loja podem ser alterados na aba Loja. Configure também o papel no driver da impressora e desative os cabeçalhos do navegador.</p>
        </div>
        <div className="receipt-preview-wrapper"><p className="preview-caption">PRÉVIA DO CUPOM <span>Pedido de exemplo</span></p><ReceiptPreview /></div>
      </div>
    </section>
  );
}