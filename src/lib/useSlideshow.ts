import { useCallback, useEffect, useRef, useState } from "react";

function cycle(ids: string[], mode: "sequence" | "shuffle", previous = "") {
  const result = [...ids];
  if (mode === "shuffle") {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    if (result.length > 1 && result[0] === previous) [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

export function useSlideshow(ids: string[], seconds: number, mode: "sequence" | "shuffle", paused: boolean) {
  const signature = JSON.stringify(ids);
  const [currentId, setCurrentId] = useState(ids[0] || "");
  const current = useRef(currentId);
  const remaining = useRef<string[]>([]);

  useEffect(() => {
    const list = JSON.parse(signature) as string[];
    remaining.current = cycle(list, mode);
    current.current = remaining.current.shift() || "";
    setCurrentId(current.current);
  }, [signature, mode]);

  useEffect(() => {
    const list = JSON.parse(signature) as string[];
    if (paused || list.length < 2) return;
    const timer = setInterval(() => {
      if (!remaining.current.length) remaining.current = cycle(list, mode, current.current);
      current.current = remaining.current.shift() || list[0];
      setCurrentId(current.current);
    }, Math.min(120, Math.max(2, seconds)) * 1000);
    return () => clearInterval(timer);
  }, [signature, seconds, mode, paused]);

  const select = useCallback((id: string) => {
    const list = JSON.parse(signature) as string[];
    if (!list.includes(id)) return;
    current.current = id;
    setCurrentId(id);
    remaining.current = mode === "sequence" ? list.slice(list.indexOf(id) + 1) : cycle(list.filter(item => item !== id), mode);
  }, [signature, mode]);

  return { currentId, select };
}