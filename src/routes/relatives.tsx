import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { countryByCode, initialsOf, timeAgo } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";
import { SectionChips } from "@/components/execasa/SectionChips";

export const Route = createFileRoute("/relatives")({
  head: () => ({
    meta: [
      { title: "Find relatives — ExeCasa noticeboard" },
      {
        name: "description",
        content:
          "Post a notice about a relative you are looking for, search names and towns, and reach families who may have news.",
      },
      { property: "og:title", content: "Find relatives — ExeCasa noticeboard" },
      {
        property: "og:description",
        content: "Search and post notices to help reunite families across countries.",
      },
    ],
  }),
  component: Relatives,
});

type PostForm = {
  full_name: string;
  relation: string;
  last_seen: string;
  details: string;
  contact_phone: string;
};

const emptyForm: PostForm = {
  full_name: "",
  relation: "",
  last_seen: "",
  details: "",
  contact_phone: "",
};

function Relatives() {
  const { countryCode, session } = useApp();
  const country = countryByCode(countryCode);
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const posts = useQuery({
    queryKey: ["relatives", countryCode, !!session],
    queryFn: async () => {
      // Contact phone numbers are only visible to signed-in members.
      const cols = (session
        ? "id, full_name, relation, last_seen, details, contact_phone, created_at"
        : "id, full_name, relation, last_seen, details, created_at") as "id, full_name, relation, last_seen, details, contact_phone, created_at";
      const { data, error: queryError } = await supabase
        .from("relative_posts")
        .select(cols)
        .eq("country_code", countryCode)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return data;
    },
  });

  const createPost = useMutation({
    mutationFn: async (values: PostForm) => {
      if (!session) throw new Error("Sign in with your phone number to post a notice.");
      const { error: insertError } = await supabase.from("relative_posts").insert({
        author_id: session.user.id,
        country_code: countryCode,
        full_name: values.full_name,
        relation: values.relation || null,
        last_seen: values.last_seen || null,
        details: values.details || null,
        contact_phone: values.contact_phone || null,
      });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      setForm(emptyForm);
      setOpen(false);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["relatives", countryCode] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const needle = term.trim().toLowerCase();
  const visible = (posts.data ?? []).filter((post) =>
    needle.length === 0
      ? true
      : [post.full_name, post.relation, post.last_seen, post.details, post.contact_phone]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle)),
  );

  return (
    <>
      <TopBar subtitle="Find relatives" />
      <SectionChips active="relatives" />

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-bold">Notices in {country.name}</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">
            {visible.length} posted
          </span>
        </div>

        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2.5">
              <Search className="size-4 shrink-0 text-foreground/40" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search a name, town, phone…"
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Post a notice"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        {open ? (
          <form
            className="glass-card mt-2 space-y-2 rounded-2xl p-3"
            onSubmit={(e) => {
              e.preventDefault();
              createPost.mutate(form);
            }}
          >
            {!session ? (
              <p className="text-[11px] font-medium text-blush">
                <Link to="/auth" className="underline">
                  Sign in with your phone number
                </Link>{" "}
                to post a notice.
              </p>
            ) : null}
            <Field
              label="Full name"
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
              required
            />
            <Field
              label="Relation (aunt, brother…)"
              value={form.relation}
              onChange={(v) => setForm({ ...form, relation: v })}
            />
            <Field
              label="Last seen (place, year)"
              value={form.last_seen}
              onChange={(v) => setForm({ ...form, last_seen: v })}
            />
            <Field
              label="Their story"
              value={form.details}
              onChange={(v) => setForm({ ...form, details: v })}
              textarea
            />
            <Field
              label="Contact phone"
              value={form.contact_phone}
              onChange={(v) => setForm({ ...form, contact_phone: v })}
            />
            {error ? <p className="text-[11px] font-medium text-blush">{error}</p> : null}
            <button
              type="submit"
              disabled={createPost.isPending || !session}
              className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-brand-foreground disabled:opacity-50"
            >
              {createPost.isPending ? "Posting…" : "Post notice"}
            </button>
          </form>
        ) : null}

        <div className="mt-2 space-y-2">
          {posts.isLoading ? <div className="glass-card h-20 animate-pulse rounded-2xl" /> : null}
          {visible.map((post) => (
            <div key={post.id} className="glass-card rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-pine/15 text-sm font-bold text-pine">
                  {initialsOf(post.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    Looking for {post.relation ? `${post.relation.toLowerCase()} ` : ""}
                    {post.full_name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {post.last_seen ?? "Place unknown"} · {timeAgo(post.created_at)}
                  </p>
                </div>
              </div>
              {post.details ? (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {post.details}
                </p>
              ) : null}
              {post.contact_phone ? (
                <a
                  href={`tel:${post.contact_phone}`}
                  className="mt-2 inline-block rounded-full bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand"
                >
                  Call {post.contact_phone}
                </a>
              ) : null}
            </div>
          ))}
          {!posts.isLoading && visible.length === 0 ? (
            <p className="glass-card rounded-2xl p-4 text-xs text-muted-foreground">
              No notices match that search yet.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          required={required}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl bg-foreground/5 px-3 py-2 text-xs outline-none"
        />
      ) : (
        <input
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl bg-foreground/5 px-3 py-2 text-xs outline-none"
        />
      )}
    </label>
  );
}
