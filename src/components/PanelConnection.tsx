import { MonitorPlay, Volume2, VolumeX } from "lucide-react";
import { useShop } from "../lib/shop";

export default function PanelConnection() {
  const { panelCount, panelHasAudio, openPanel } = useShop();
  return <div className={`panel-connection ${panelCount ? "connected" : ""}`}>
    <MonitorPlay size={20} />
    <div><strong>{panelCount ? "TV conectada ao atendimento" : "Nenhuma TV conectada"}</strong><p>{panelCount
      ? panelHasAudio ? "Número e nome serão exibidos. Áudio liberado no painel." : "A chamada visual funciona. Clique em Ativar som e voz na janela da TV para ouvir."
      : "Abra a TV por este botão, no mesmo navegador e perfil. Outro navegador ou computador não recebe estes pedidos."}</p></div>
    {panelCount > 0 && <span className="panel-audio-state">{panelHasAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}{panelHasAudio ? "Áudio ativo" : "Sem áudio"}</span>}
    <button className="action-button secondary" onClick={openPanel}>{panelCount ? "Ir para a TV" : "Abrir painel da TV"}</button>
  </div>;
}