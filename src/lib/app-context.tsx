import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "./execasa";

type AppState = {
  countryCode: string;
  setCountryCode: (code: string) => void;
  session: Session | null;
  loadingSession: boolean;
  phone: string | null;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);
const STORAGE_KEY = "execasa.country";

export function AppProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountry] = useState(COUNTRIES[0]!.code);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && COUNTRIES.some((c) => c.code === saved)) setCountry(saved);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoadingSession(false);
    });
    void supabase.auth.getSession().then(({ data: current }) => {
      setSession(current.session);
      setLoadingSession(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AppState>(
    () => ({
      countryCode,
      setCountryCode: (code: string) => {
        setCountry(code);
        window.localStorage.setItem(STORAGE_KEY, code);
      },
      session,
      loadingSession,
      phone: (session?.user.user_metadata?.["phone_number"] as string | undefined) ?? null,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [countryCode, session, loadingSession],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
