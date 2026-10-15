import { useCallback, useEffect, useRef, useState } from "react";
import { sendToWindows, subscribeWindows, type WindowRole } from "./windowSync";

export interface CallAcknowledgment { orderId: string; at: number; }
interface Peer { role: WindowRole; audio: boolean; seenAt: number; }

export function usePanelLink(isPanel: boolean) {
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [panelAudioEnabled, setPanelAudioEnabled] = useState(false);
  const [callAcknowledgment, setCallAcknowledgment] = useState<CallAcknowledgment | null>(null);
  const audio = useRef(panelAudioEnabled);
  audio.current = panelAudioEnabled;

  useEffect(() => {
    const role: WindowRole = isPanel ? "panel" : "operator";
    const presence = () => sendToWindows({ type: "presence", role, audio: audio.current });
    const unsubscribe = subscribeWindows((message, sender) => {
      if (message.type === "presence") setPeers(current => ({ ...current, [sender]: { role: message.role, audio: message.audio, seenAt: Date.now() } }));
      if (message.type === "hello") presence();
      if (message.type === "call-ack") setCallAcknowledgment({ orderId: message.orderId, at: message.at });
      if (message.type === "bye") setPeers(current => { const next = { ...current }; delete next[sender]; return next; });
    });
    sendToWindows({ type: "hello", role });
    presence();
    const interval = setInterval(() => {
      presence();
      setPeers(current => {
        const active = Object.entries(current).filter(([, peer]) => Date.now() - peer.seenAt < 18000);
        return active.length === Object.keys(current).length ? current : Object.fromEntries(active);
      });
    }, 3000);
    const wake = () => { sendToWindows({ type: "hello", role }); presence(); };
    const leave = () => sendToWindows({ type: "bye" });
    window.addEventListener("focus", wake); window.addEventListener("pageshow", wake); window.addEventListener("pagehide", leave);
    return () => {
      leave(); unsubscribe(); clearInterval(interval);
      window.removeEventListener("focus", wake); window.removeEventListener("pageshow", wake); window.removeEventListener("pagehide", leave);
    };
  }, [isPanel]);

  useEffect(() => { sendToWindows({ type: "presence", role: isPanel ? "panel" : "operator", audio: panelAudioEnabled }); }, [isPanel, panelAudioEnabled]);
  const acknowledgeCall = useCallback((orderId: string, at: number) => sendToWindows({ type: "call-ack", orderId, at }), []);
  const panels = Object.values(peers).filter(peer => peer.role === "panel");
  return {
    panelCount: panels.length,
    panelHasAudio: panels.some(peer => peer.audio),
    operatorConnected: Object.values(peers).some(peer => peer.role === "operator"),
    callAcknowledgment, setPanelAudioEnabled, acknowledgeCall,
  };
}