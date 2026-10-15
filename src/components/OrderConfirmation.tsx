import { useState } from "react";
import { CheckCircle2, Printer, X } from "lucide-react";
import { brl, itemTotal, pad, type Order } from "../lib/shop";
import Modal from "./Modal";
import { ReceiptPreview } from "./ReceiptSettingsPanel";

export default function OrderConfirmation({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (print: boolean) => void }) {
  const [preview, setPreview] = useState(false);
  return <Modal label="Conferir pedido antes de confirmar" onClose={onClose} className="order-confirmation">
    <header className="modal-heading"><div><p className="eyebrow">CONFIRA COM O CLIENTE</p><h2>Nº {pad(order.number)} · {order.customer}</h2><p>{order.type} · Pagamento: {order.payment}</p></div><button className="icon-action" aria-label="Voltar para ajustar" onClick={onClose}><X size={20} /></button></header>
    <div className="confirmation-tabs"><button className={!preview ? "active" : ""} onClick={() => setPreview(false)}>Revisão do pedido</button><button className={preview ? "active" : ""} onClick={() => setPreview(true)}><Printer size={15} /> Prévia do cupom</button></div>
    <div className="confirmation-body nice-scroll">
      {preview ? <ReceiptPreview order={order} /> : <>
        <ul className="confirmation-items">{order.items.map(item => <li key={item.uid}>
          <div><strong>{item.qty}x {item.name}</strong><strong>{brl(itemTotal(item))}</strong></div>
          <p>{brl(item.unitPrice)} por unidade</p>
          {item.extras.length > 0 && <p>+ {item.extras.map(extra => `${extra.name} (${brl(extra.price)})`).join(", ")}</p>}
          {item.observation && <p className="confirmation-note">Obs.: {item.observation}</p>}
        </li>)}</ul>
        {order.note && <div className="copy-notice"><strong>Observação geral:</strong> {order.note}</div>}
      </>}
    </div>
    <footer className="confirmation-footer">
      <p className="confirmation-customer">Chamada na TV: <strong>Nº {pad(order.number)} · {order.customer}</strong></p>
      <div className="review-grand-total"><span>Total do pedido</span><strong>{brl(order.total)}</strong></div>
      <button className="action-button primary" onClick={() => onConfirm(true)}><Printer size={19} /> Confirmar e imprimir</button>
      <button className="action-button secondary" onClick={() => onConfirm(false)}><CheckCircle2 size={18} /> Confirmar sem imprimir</button>
      <button className="text-action" onClick={onClose}>Voltar para ajustar o pedido</button>
    </footer>
  </Modal>;
}