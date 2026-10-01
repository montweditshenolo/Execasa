export type Country = {
  code: string;
  name: string;
  flag: string;
  dial: string;
};

export const COUNTRIES: Country[] = [
  { code: "GH", name: "Ghana", flag: "🇬🇭", dial: "+233" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "+234" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dial: "+254" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "+27" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dial: "+267" },
];

export function countryByCode(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]!;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "EC";
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/**
 * People sign in with their phone number only. Behind the scenes each number
 * maps to a stable internal account address so no email is ever required.
 */
export function normalisePhone(dial: string, local: string) {
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  return `${dial}${digits}`;
}

export function phoneToAccountEmail(fullPhone: string) {
  return `${fullPhone.replace(/\D/g, "")}@phone.execasa.app`;
}
