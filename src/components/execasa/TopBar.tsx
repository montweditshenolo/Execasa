import { Link } from "@tanstack/react-router";

import { COUNTRIES, countryByCode } from "@/lib/execasa";
import { useApp } from "@/lib/app-context";

export function TopBar({ subtitle }: { subtitle?: string }) {
  const { countryCode, setCountryCode, session, phone, signOut } = useApp();
  const country = countryByCode(countryCode);

  return (
    <header className="glass-card flex items-center justify-between rounded-2xl px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-sm font-extrabold text-brand-foreground">
          EC
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold leading-none tracking-tight">ExeCasa</p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
            {subtitle ?? `${country.flag} ${country.name}`}
            {phone ? ` · ${phone}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="glass-panel relative grid h-9 place-items-center rounded-xl px-2 text-xs font-semibold">
          <span className="pointer-events-none">{country.flag}</span>
          <select
            aria-label="Choose country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {session ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="glass-panel h-9 rounded-xl px-3 text-[11px] font-bold text-foreground/70"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/auth"
            className="h-9 rounded-xl bg-brand px-3 text-[11px] font-bold leading-9 text-brand-foreground"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
