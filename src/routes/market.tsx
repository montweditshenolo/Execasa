import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { countryByCode, timeAgo } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";
import { SectionChips } from "@/components/execasa/SectionChips";

type Kind = "all" | "job" | "sale";

export const Route = createFileRoute("/market")({
  validateSearch: (search: Record<string, unknown>): { kind: Kind } => {
    const kind = search["kind"];
    return { kind: kind === "job" || kind === "sale" ? kind : "all" };
  },
  head: () => ({
    meta: [
      { title: "Jobs, piece work, buy & sell — ExeCasa" },
      {
        name: "description",
        content:
          "Find piece jobs and vacancies near you, or post something to sell. Local listings by country.",
      },
      { property: "og:title", content: "Jobs, piece work, buy & sell — ExeCasa" },
      {
        property: "og:description",
        content: "Piece jobs, vacancies and buy-and-sell listings posted by people in your country.",
      },
    ],
  }),
  component: Market,
});

const emptyForm = { kind: "sale", title: "", detail: "", price_text: "", location: "" };

function Market() {
  const { kind } = Route.useSearch();
  const navigate = useNavigate({ from: "/market" });
  const { countryCode, session } = useApp();
  const country = countryByCode(countryCode);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const listings = useQuery({
    queryKey: ["listings", countryCode, kind],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, kind, title, detail, price_text, location, created_at")
        .eq("country_code", countryCode);
      if (kind !== "all") query = query.eq("kind", kind);
      const { data, error: queryError } = await query.order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return data;
    },
  });

  const createListing = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Sign in with your phone number to post a listing.");
      const { error: insertError } = await supabase.from("listings").insert({
        author_id: session.user.id,
        country_code: countryCode,
        kind: form.kind,
        title: form.title,
        detail: form.detail || null,
        price_text: form.price_text || null,
        location: form.location || null,
      });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      setForm(emptyForm);
      setOpen(false);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const filterChip = (value: Kind, label: string) => (
    <button
      type="button"
      key={value}
      onClick={() => void navigate({ search: { kind: value } })}
      className={
        kind === value
          ? "rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-brand-foreground"
          : "glass-panel rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground/70"
      }
    >
      {label}
    </button>
  );

  return (
    <>
      <TopBar subtitle="Jobs, buy & sell" />
      <SectionChips active={kind === "job" ? "jobs" : "market"} />

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-bold">{country.name} listings</p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-brand-foreground"
          >
            <Plus className="size-3.5" /> Post
          </button>
        </div>

        <div className="mb-2 flex gap-2">
          {filterChip("all", "Everything")}
          {filterChip("job", "Jobs")}
          {filterChip("sale", "For sale")}
        </div>

        {open ? (
          <form
            className="glass-card mb-3 space-y-2 rounded-2xl p-3"
            onSubmit={(e) => {
              e.preventDefault();
              createListing.mutate();
            }}
          >
            {!session ? (
              <p className="text-[11px] font-medium text-blush">
                <Link to="/auth" className="underline">
                  Sign in with your phone number
                </Link>{" "}
                to post.
              </p>
            ) : null}
            <div className="flex gap-2">
              {(["sale", "job"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setForm({ ...form, kind: value })}
                  className={
                    form.kind === value
                      ? "flex-1 rounded-xl bg-brand py-2 text-[11px] font-bold text-brand-foreground"
                      : "glass-panel flex-1 rounded-xl py-2 text-[11px] font-bold text-foreground/70"
                  }
                >
                  {value === "sale" ? "Selling something" : "Offering a job"}
                </button>
              ))}
            </div>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded-xl bg-foreground/5 px-3 py-2 text-xs outline-none"
            />
            <textarea
              rows={3}
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              placeholder="Details"
              className="w-full rounded-xl bg-foreground/5 px-3 py-2 text-xs outline-none"
            />
            <div className="flex gap-2">
              <input
                value={form.price_text}
                onChange={(e) => setForm({ ...form, price_text: e.target.value })}
                placeholder="Price or pay"
                className="w-full rounded-xl bg-foreground/5 px-3 py-2 text-xs outline-none"
              />
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Town"
                className="w-full rounded-xl bg-foreground/5 px-3 py-2 text-xs outline-none"
              />
            </div>
            {error ? <p className="text-[11px] font-medium text-blush">{error}</p> : null}
            <button
              type="submit"
              disabled={createListing.isPending || !session}
              className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-brand-foreground disabled:opacity-50"
            >
              {createListing.isPending ? "Posting…" : "Post listing"}
            </button>
          </form>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {listings.data?.map((item) => (
            <div key={item.id} className="glass-card rounded-2xl p-3">
              <span
                className={
                  item.kind === "job"
                    ? "rounded-full bg-pine/15 px-2 py-0.5 text-[10px] font-bold text-pine"
                    : "rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent"
                }
              >
                {item.kind === "job" ? "Job" : "For sale"}
              </span>
              <p className="mt-2 text-sm font-bold leading-tight">{item.title}</p>
              {item.detail ? (
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] font-semibold text-foreground/60">
                {[item.location, item.price_text].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</p>
            </div>
          ))}
        </div>
        {listings.isLoading ? (
          <div className="glass-card mt-2 h-24 animate-pulse rounded-2xl" />
        ) : null}
        {!listings.isLoading && (listings.data?.length ?? 0) === 0 ? (
          <p className="glass-card rounded-2xl p-4 text-xs text-muted-foreground">
            Nothing posted here yet — be the first.
          </p>
        ) : null}
      </section>
    </>
  );
}
