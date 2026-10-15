import { useCallback, useEffect, useRef, useState } from "react";
import { customerName, type Order } from "./shop";

interface Announcement { text: string; orderId?: string; }
export const orderAnnouncement = (order: Pick<Order, "number" | "customer">) =>
  `Pedido número ${order.number}. ${customerName(order.customer)}. Seu pedido está pronto. Retire no balcão.`;

export function useCallAudio(soundOn: boolean, voiceOn: boolean, readyOrderIds: string[]) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const context = useRef<AudioContext | null>(null);
  const options = useRef({ soundOn, voiceOn, readyOrderIds });
  options.current = { soundOn, voiceOn, readyOrderIds };
  const unlocked = useRef(false);
  const queue = useRef<Announcement[]>([]);
  const playing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const generation = useRef(0);
  const next = useRef<() => void>(() => undefined);

  const stop = useCallback(() => {
    generation.current++;
    queue.current = []; playing.current = false;
    if (timer.current) clearTimeout(timer.current);
    if (watchdog.current) clearTimeout(watchdog.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utterance.current = null;
  }, []);

  useEffect(() => {
    const inspect = () => {
      const supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
      setVoiceAvailable(supported);
      if (supported) window.speechSynthesis.getVoices();
    };
    inspect();
    if ("speechSynthesis" in window) window.speechSynthesis.addEventListener("voiceschanged", inspect);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.removeEventListener("voiceschanged", inspect);
      stop();
      const ctx = context.current; context.current = null;
      if (ctx && ctx.state !== "closed") void ctx.close().catch(() => undefined);
    };
  }, [stop]);

  // Process each click once, in order, instead of interrupting the previous client's name.
  next.current = () => {
    if (playing.current || !unlocked.current || !options.current.soundOn) return;
    const job = queue.current.shift();
    if (!job) return;
    if (job.orderId && !options.current.readyOrderIds.includes(job.orderId)) { next.current(); return; }
    playing.current = true;
    const version = generation.current;
    let finished = false;
    const finish = () => {
      if (finished || generation.current !== version) return;
      finished = true;
      if (watchdog.current) clearTimeout(watchdog.current);
      utterance.current = null; playing.current = false;
      timer.current = setTimeout(() => next.current(), 200);
    };
    const speak = () => {
      if (generation.current !== version) return;
      if (job.orderId && !options.current.readyOrderIds.includes(job.orderId)) { finish(); return; }
      if (!options.current.voiceOn) { finish(); return; }
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        setError("Este navegador não oferece voz. A campainha e a chamada visual continuam funcionando."); finish(); return;
      }
      try {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();
        const portuguese = voices.filter(voice => /^pt(?:[-_]|$)/i.test(voice.lang));
        const voice = portuguese.find(item => item.localService && /^pt[-_]BR$/i.test(item.lang))
          || portuguese.find(item => item.localService) || portuguese.find(item => /^pt[-_]BR$/i.test(item.lang)) || portuguese[0];
        const speech = new SpeechSynthesisUtterance(job.text);
        speech.lang = "pt-BR"; speech.rate = 0.93; speech.pitch = 1; speech.volume = 1;
        if (voice) speech.voice = voice;
        utterance.current = speech;
        speech.onend = finish;
        speech.onerror = event => {
          if (generation.current !== version) return;
          if (!["canceled", "interrupted"].includes(event.error)) setError("Não foi possível falar a chamada. Use Testar chamada, confira o áudio e instale uma voz em português no computador para uso offline.");
          finish();
        };
        synth.resume(); synth.speak(speech);
        watchdog.current = setTimeout(() => {
          if (generation.current !== version || finished) return;
          setError("A voz não respondeu a tempo. Teste o áudio ou verifique a voz em português instalada no computador.");
          finish(); synth.cancel();
        }, 25000);
      } catch {
        setError("O navegador bloqueou a voz. Clique em Testar chamada na TV para liberar o áudio."); finish();
      }
    };
    const bell = async () => {
      try {
        const ctx = context.current;
        if (ctx) {
          if (ctx.state === "suspended") await ctx.resume();
          if (generation.current !== version) return;
          [880, 1174.66, 880].forEach((frequency, index) => {
            const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
            const at = ctx.currentTime + index * 0.22;
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.exponentialRampToValueAtTime(0.25, at + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
            oscillator.connect(gain); gain.connect(ctx.destination);
            oscillator.start(at); oscillator.stop(at + 0.35);
            oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
          });
        }
      } catch { setError("Confira a saída de som da TV e clique em Testar chamada."); }
      if (generation.current === version) timer.current = setTimeout(speak, 850);
    };
    void bell();
  };

  useEffect(() => {
    if (!soundOn) { unlocked.current = false; setEnabled(false); stop(); }
  }, [soundOn, stop]);

  const activate = useCallback(async (test = false) => {
    if (!options.current.soundOn) return;
    setError("");
    try {
      if (!context.current || context.current.state === "closed") context.current = new AudioContext();
      await context.current.resume();
    } catch { setError("Campainha indisponível. A chamada por voz será tentada; confira o som do navegador."); }
    unlocked.current = true; setEnabled(true);
    stop();
    queue.current.push({ text: test ? "Teste de chamada. Pedido número 123. Cliente Maria. Este é apenas um teste de som." : "Chamadas ativadas. O número e o nome do cliente serão anunciados quando o pedido estiver pronto." });
    next.current();
  }, [stop]);

  const mute = useCallback(() => {
    unlocked.current = false; setEnabled(false); stop();
    if (context.current?.state === "running") void context.current.suspend().catch(() => undefined);
  }, [stop]);

  const announce = useCallback((order: Order) => {
    if (!unlocked.current || !options.current.soundOn) return;
    queue.current.push({ text: orderAnnouncement(order), orderId: order.id });
    next.current();
  }, []);

  return { enabled, error, voiceAvailable, activate, mute, announce, clearError: () => setError("") };
}