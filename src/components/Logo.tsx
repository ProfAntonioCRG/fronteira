import { useShop } from "../lib/shop";

export default function Logo({ size = 52, withText = true, light = false }: { size?: number; withText?: boolean; light?: boolean }) {
  const { settings } = useShop();
  return (
    <div className="flex items-center gap-3 min-w-0">
      <img src="images/logo.png" alt="Fronteira Açaí & Doces" width={size} height={size}
        className="rounded-full object-cover ring-2 ring-amber-400/80 shadow-lg shadow-purple-950/40 shrink-0 bg-[#3d0a2a]" />
      {withText && (
        <div className="leading-none min-w-0">
          <div className={`font-display font-extrabold tracking-wide truncate ${light ? "text-amber-50" : "text-purple-950"}`} style={{ fontSize: size * 0.42 }}>
            {settings.storeName}
          </div>
          <div className="text-amber-500 font-display font-bold tracking-[0.18em] uppercase" style={{ fontSize: size * 0.21 }}>
            {settings.tagline}
          </div>
        </div>
      )}
    </div>
  );
}
