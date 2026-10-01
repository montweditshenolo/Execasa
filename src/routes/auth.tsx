import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { COUNTRIES, countryByCode, normalisePhone, phoneToAccountEmail } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in with your phone number — ExeCasa" },
      {
        name: "description",
        content:
          "Use your phone number and a passcode to join ExeCasa: chat, post notices about relatives, and list jobs or goods.",
      },
      { property: "og:title", content: "Sign in with your phone number — ExeCasa" },
      {
        property: "og:description",
        content: "Phone number sign-in for ExeCasa chats, notices and listings.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { countryCode } = useApp();
  const [dial, setDial] = useState(countryByCode(countryCode).dial);
  const [local, setLocal] = useState("");
  const [passcode, setPasscode] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const fullPhone = normalisePhone(dial, local);
    const email = phoneToAccountEmail(fullPhone);
    try {
      if (mode === "up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: passcode,
          options: { data: { phone_number: fullPhone } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: passcode,
        });
        if (signInError) throw signInError;
      }
      await navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Invalid login credentials", "That number and passcode don't match.")
          : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar subtitle="Your account" />

      <section className="glass-card mt-6 rounded-3xl p-5">
        <h1 className="text-lg font-bold">
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your phone number is your name here. Pick a passcode you will remember.
        </p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="flex gap-2">
            <select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              className="rounded-xl bg-foreground/5 px-2 py-2.5 text-xs font-bold outline-none"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dial}>
                  {c.flag} {c.dial}
                </option>
              ))}
            </select>
            <input
              required
              inputMode="tel"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="24 123 4567"
              className="flex-1 rounded-xl bg-foreground/5 px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <input
            required
            type="password"
            minLength={6}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode (at least 6 characters)"
            className="w-full rounded-xl bg-foreground/5 px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground"
          />
          {error ? <p className="text-[11px] font-medium text-blush">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand py-3 text-xs font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-[11px] font-bold text-brand"
        >
          {mode === "in" ? "New here? Create an account" : "I already have an account"}
        </button>
      </section>
    </>
  );
}
