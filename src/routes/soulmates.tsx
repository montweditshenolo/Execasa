import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Mic, Send, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { countryByCode, initialsOf, timeAgo } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";
import { SoulmateMatch } from "@/components/execasa/SoulmateMatch";

export const Route = createFileRoute("/soulmates")({
  head: () => ({
    meta: [
      { title: "Find a soulmate — ExeCasa" },
      {
        name: "description",
        content:
          "Meet people looking for love in your country. Post your own introduction and join the live Soulmates voice room.",
      },
      { property: "og:title", content: "Find a soulmate — ExeCasa" },
      {
        property: "og:description",
        content: "A noticeboard for people looking for love, plus live voice rooms to talk and connect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Soulmates,
});

type Post = {
  id: string;
  author_id: string | null;
  display_name: string;
  age: number | null;
  gender: string | null;
  seeking: string | null;
  about: string | null;
  created_at: string;
};

function Soulmates() {
  const { countryCode, session, phone } = useApp();
  const country = countryByCode(countryCode);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const posts = useQuery({
    queryKey: ["soulmates", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("soulmate_posts" as never)
        .select("id, author_id, display_name, age, gender, seeking, about, created_at")
        .eq("country_code", countryCode)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });

  async function removePost(id: string) {
    const { error } = await supabase.from("soulmate_posts" as never).delete().eq("id", id);
    if (!error) void queryClient.invalidateQueries({ queryKey: ["soulmates", countryCode] });
  }

  return (
    <>
      <TopBar subtitle={`Soulmates in ${country.name}`} />

      <Link
        to="/rooms"
        className="glass-card mt-4 flex items-center gap-3 rounded-3xl p-4"
      >
        <span className="grid size-11 place-items-center rounded-2xl bg-blush/15 text-blush">
          <Mic className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold">Talk live in the Soulmates room</span>
          <span className="block text-xs text-muted-foreground">
            Hear each other's voices before you meet
          </span>
        </span>
        <Heart className="size-4 text-blush" />
      </Link>

      {session ? (
        <SoulmateMatch userId={session.user.id} countryCode={countryCode} defaultName={phone ?? ""} />
      ) : null}


      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-sm font-bold">Looking for love</p>
        {session ? (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-bold text-brand-foreground"
          >
            {showForm ? "Close" : "Post your intro"}
          </button>
        ) : (
          <Link to="/auth" className="text-[11px] font-bold text-brand">
            Sign in to post
          </Link>
        )}
      </div>

      {showForm && session ? (
        <PostForm
          countryCode={countryCode}
          defaultName={phone ?? ""}
          onDone={() => {
            setShowForm(false);
            void queryClient.invalidateQueries({ queryKey: ["soulmates", countryCode] });
          }}
        />
      ) : null}

      <div className="mt-3 space-y-2">
        {posts.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card h-24 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : null}
        {posts.data?.length === 0 ? (
          <p className="glass-card rounded-2xl p-4 text-xs text-muted-foreground">
            No introductions in {country.name} yet. Be the first to post yours.
          </p>
        ) : null}
        {posts.data?.map((post) => (
          <article key={post.id} className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-blush/15 text-sm font-bold text-blush">
                {initialsOf(post.display_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {post.display_name}
                  {post.age ? `, ${post.age}` : ""}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {[post.gender, post.seeking ? `looking for ${post.seeking.toLowerCase()}` : null]
                    .filter(Boolean)
                    .join(" · ") || timeAgo(post.created_at)}
                </p>
              </div>
              {session && post.author_id === session.user.id ? (
                <button
                  onClick={() => void removePost(post.id)}
                  aria-label="Delete your post"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground/60"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : (
                <Link
                  to="/chats"
                  className="shrink-0 rounded-full bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand"
                >
                  Say hi
                </Link>
              )}
            </div>
            {post.about ? (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{post.about}</p>
            ) : null}
          </article>
        ))}
      </div>

      <p className="mt-4 px-2 text-center text-[11px] text-muted-foreground">
        Take your time. Never send money to someone you haven't met in person.
      </p>
    </>
  );
}

function PostForm({
  countryCode,
  defaultName,
  onDone,
}: {
  countryCode: string;
  defaultName: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Woman");
  const [seeking, setSeeking] = useState("Man");
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Please add your name or nickname.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("soulmate_posts" as never).insert({
      display_name: name.trim(),
      age: age ? Number(age) : null,
      gender,
      seeking,
      about: about.trim() || null,
      country_code: countryCode,
    } as never);
    setBusy(false);
    if (err) {
      setError("Couldn't post. Try again.");
      return;
    }
    onDone();
  }

  const input =
    "w-full rounded-xl bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60";

  return (
    <div className="glass-card mt-3 space-y-2 rounded-2xl p-4">
      <input className={input} placeholder="Your name or nickname" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className={input}
        placeholder="Your age (optional)"
        inputMode="numeric"
        value={age}
        onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
      />
      <div className="flex gap-2">
        <select className={input} value={gender} onChange={(e) => setGender(e.target.value)} aria-label="I am">
          <option>Woman</option>
          <option>Man</option>
          <option>Other</option>
        </select>
        <select className={input} value={seeking} onChange={(e) => setSeeking(e.target.value)} aria-label="Looking for">
          <option>Man</option>
          <option>Woman</option>
          <option>Anyone</option>
        </select>
      </div>
      <textarea
        className={`${input} min-h-20 resize-none`}
        placeholder="Tell people a little about yourself…"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
      />
      {error ? <p className="text-xs font-medium text-blush">{error}</p> : null}
      <button
        onClick={() => void submit()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
      >
        <Send className="size-4" /> {busy ? "Posting…" : "Post my intro"}
      </button>
    </div>
  );
}
