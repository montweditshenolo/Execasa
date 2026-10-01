import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Lock, Sparkles, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { initialsOf } from "@/lib/execasa";
import { recommendSoulmates } from "@/lib/soulmate.functions";

type Profile = {
  display_name: string;
  age: number | null;
  gender: string;
  seeking: string;
  interests: string;
  personal_values: string;
  partner_preferences: string;
  about: string;
  show_age: boolean;
  show_gender: boolean;
  show_interests: boolean;
  show_values: boolean;
  show_preferences: boolean;
  show_about: boolean;
  visibility: "everyone" | "members" | "hidden";
};

const empty: Profile = {
  display_name: "", age: null, gender: "Woman", seeking: "Man", interests: "", personal_values: "",
  partner_preferences: "", about: "", show_age: true, show_gender: true, show_interests: true,
  show_values: true, show_preferences: false, show_about: true, visibility: "members",
};

type MatchResult = Awaited<ReturnType<typeof recommendSoulmates>>["matches"][number];

const input = "w-full rounded-xl bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60";

export function SoulmateMatch({ userId, countryCode, defaultName }: { userId: string; countryCode: string; defaultName: string }) {
  const [p, setP] = useState<Profile>({ ...empty, display_name: defaultName });
  const [hasProfile, setHasProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [finding, setFinding] = useState(false);
  const recommend = useServerFn(recommendSoulmates);

  useEffect(() => {
    void supabase.from("soulmate_profiles" as never).select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) {
        const d = data as Record<string, unknown>;
        setP({ ...empty, ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ?? (k === "age" ? null : "")])) } as Profile);
        setHasProfile(true);
      } else setEditing(true);
    });
  }, [userId]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((s) => ({ ...s, [k]: v }));

  async function save() {
    if (!p.display_name.trim()) return setMsg("Please add your name or nickname.");
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("soulmate_profiles" as never).upsert({ ...p, user_id: userId, country_code: countryCode } as never);
    setSaving(false);
    if (error) return setMsg("Couldn't save. Try again.");
    setHasProfile(true);
    setEditing(false);
  }

  async function find() {
    setFinding(true);
    setMsg(null);
    try {
      const r = await recommend();
      if (r.error) setMsg(r.error);
      setMatches(r.matches);
    } catch {
      setMsg("Couldn't find matches right now.");
    } finally {
      setFinding(false);
    }
  }

  const toggle = (k: keyof Profile, label: string) => (
    <label className="flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2 text-xs">
      <span>{label}</span>
      <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={p[k] as boolean} onChange={(e) => set(k, e.target.checked as never)} />
    </label>
  );

  return (
    <section className="glass-card mt-4 rounded-3xl p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-blush" />
        <p className="flex-1 text-sm font-bold">AI compatibility matches</p>
        {hasProfile && !editing ? (
          <button onClick={() => setEditing(true)} className="text-[11px] font-bold text-brand">Edit profile & privacy</button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">Tell us about you and who you hope to meet.</p>
          <input className={input} placeholder="Name or nickname" value={p.display_name} onChange={(e) => set("display_name", e.target.value)} />
          <input className={input} placeholder="Age" inputMode="numeric" value={p.age ?? ""} onChange={(e) => set("age", e.target.value ? Number(e.target.value.replace(/\D/g, "").slice(0, 2)) : null)} />
          <div className="flex gap-2">
            <select className={input} aria-label="I am" value={p.gender} onChange={(e) => set("gender", e.target.value)}>
              <option>Woman</option><option>Man</option><option>Other</option>
            </select>
            <select className={input} aria-label="Looking for" value={p.seeking} onChange={(e) => set("seeking", e.target.value)}>
              <option>Man</option><option>Woman</option><option>Anyone</option>
            </select>
          </div>
          <textarea className={`${input} min-h-16 resize-none`} placeholder="Interests (e.g. football, gospel music, cooking)" value={p.interests} onChange={(e) => set("interests", e.target.value)} />
          <textarea className={`${input} min-h-16 resize-none`} placeholder="Values (e.g. faith, family, honesty)" value={p.personal_values} onChange={(e) => set("personal_values", e.target.value)} />
          <textarea className={`${input} min-h-16 resize-none`} placeholder="Partner preferences (age range, kind of person)" value={p.partner_preferences} onChange={(e) => set("partner_preferences", e.target.value)} />
          <textarea className={`${input} min-h-16 resize-none`} placeholder="About me" value={p.about} onChange={(e) => set("about", e.target.value)} />

          <p className="flex items-center gap-1.5 pt-2 text-xs font-bold"><Lock className="size-3.5" /> Privacy</p>
          <p className="text-[11px] text-muted-foreground">Choose what others can see. Your name is always shown.</p>
          <div className="grid grid-cols-2 gap-2">
            {toggle("show_age", "Age")}
            {toggle("show_gender", "Gender")}
            {toggle("show_interests", "Interests")}
            {toggle("show_values", "Values")}
            {toggle("show_preferences", "Preferences")}
            {toggle("show_about", "About me")}
          </div>
          <label className="block text-xs font-bold"><Eye className="mr-1 inline size-3.5" />Who can see my profile</label>
          <select className={input} value={p.visibility} onChange={(e) => set("visibility", e.target.value as Profile["visibility"])}>
            <option value="everyone">Everyone</option>
            <option value="members">Signed-in members only</option>
            <option value="hidden">Nobody (hidden)</option>
          </select>
          <button onClick={() => void save()} disabled={saving} className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      ) : hasProfile ? (
        <button onClick={() => void find()} disabled={finding} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50">
          <Sparkles className="size-4" /> {finding ? "Finding your matches…" : "Find compatible people"}
        </button>
      ) : null}

      {msg ? <p className="mt-2 text-xs font-medium text-blush">{msg}</p> : null}

      {matches && !editing ? (
        <div className="mt-3 space-y-2">
          {matches.length === 0 && !msg ? (
            <p className="text-xs text-muted-foreground">No strong matches yet. Check back as more people join.</p>
          ) : null}
          {matches.map((m) => (
            <article key={m.user_id} className="rounded-2xl bg-foreground/5 p-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-blush/15 text-sm font-bold text-blush">
                  {initialsOf(m.profile.display_name) || <UserRound className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{m.profile.display_name}{m.profile.age ? `, ${m.profile.age}` : ""}</p>
                  {m.profile.interests ? <p className="truncate text-[11px] text-muted-foreground">{m.profile.interests}</p> : null}
                </div>
                <span className="rounded-full bg-blush/15 px-2.5 py-1 text-[11px] font-bold text-blush">{m.score}%</span>
              </div>
              <ul className="mt-2 space-y-1">
                {m.reasons.map((r, i) => (
                  <li key={i} className="text-[11px] leading-relaxed text-muted-foreground">• {r}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
