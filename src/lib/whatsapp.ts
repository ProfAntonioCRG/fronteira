export interface WhatsAppSettings {
  enabled: boolean;
  countryCode: string;
  phone: string;
  message: string;
  caption: string;
  size: "normal" | "large";
}

export const DEFAULT_WHATSAPP: WhatsAppSettings = {
  enabled: false,
  countryCode: "55",
  phone: "",
  message: "",
  caption: "Fale com a gente no WhatsApp",
  size: "normal",
};

export function normalizeWhatsApp(value?: Partial<WhatsAppSettings> | null): WhatsAppSettings {
  const text = (input: unknown, fallback: string, limit: number) => typeof input === "string" ? input.slice(0, limit) : fallback;
  return {
    enabled: value?.enabled === true,
    countryCode: text(value?.countryCode, "55", 4),
    phone: text(value?.phone, "", 32),
    message: text(value?.message, "", 120),
    caption: text(value?.caption, DEFAULT_WHATSAPP.caption, 64),
    size: value?.size === "large" ? "large" : "normal",
  };
}

export function whatsAppContact(value: WhatsAppSettings) {
  const country = value.countryCode.replace(/\D/g, "");
  let phone = value.phone.replace(/\D/g, "");
  // Accept a pasted international number without duplicating the selected country code.
  if (value.phone.trim().startsWith("+") && phone.startsWith(country)) phone = phone.slice(country.length);
  let error = "";
  if (!/^[1-9]\d{0,2}$/.test(country) || !/^\+?\d{1,3}$/.test(value.countryCode.trim())) {
    error = "Informe o DDI do país. Para o Brasil, use 55.";
  } else if (!value.phone.trim()) {
    error = "Informe o DDD e o número do WhatsApp da loja.";
  } else if (!/^[+\d\s().-]+$/.test(value.phone) || !/^[1-9]\d{5,13}$/.test(phone) || country.length + phone.length > 15) {
    error = "Confira o número. Use somente DDD e telefone, sem zero de operadora.";
  } else if (country === "55" && !/^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(phone)) {
    error = "Para o Brasil, informe DDD + telefone: (11) 99999-9999, por exemplo. O DDI 55 fica no campo ao lado.";
  }
  const digits = `${country}${phone}`;
  const message = Array.from(value.message.trim()).slice(0, 120).map(character => {
    const point = character.codePointAt(0)!;
    return point >= 0xd800 && point <= 0xdfff ? "\ufffd" : character;
  }).join("");
  const link = error ? "" : `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  const formatted = country === "55" && !error
    ? `+55 (${phone.slice(0, 2)}) ${phone.slice(2, -4)}-${phone.slice(-4)}`
    : `+${country} ${phone}`;
  return { valid: !error, error, link, digits, formatted };
}