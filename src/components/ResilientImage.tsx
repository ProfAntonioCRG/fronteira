import { useEffect, useState, type ImgHTMLAttributes } from "react";

// Product names and controls remain usable even if an external photo is unavailable.
export default function ResilientImage({ src, style, onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSource, setFailedSource] = useState<string>();
  const failed = failedSource === src;
  useEffect(() => {
    const retry = () => setFailedSource(undefined);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);
  return <img {...props} src={failed ? "images/logo.png" : src} style={{ ...style, ...(failed ? { objectFit: "contain", opacity: 0.65 } : {}) }} onError={event => {
    if (!failed) setFailedSource(src);
    onError?.(event);
  }} />;
}