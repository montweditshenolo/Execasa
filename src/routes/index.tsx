import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { countryByCode, initialsOf, timeAgo } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";
import { SectionChips } from "@/components/execasa/SectionChips";
import { LiveMatchCard, type MatchRow } from "@/components/execasa/LiveMatchCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExeCasa — today's news for your country" },
      {
        name: "description",
        content:
          "Your daily country news, live scores, relative notices and market listings in one place. No newspaper needed.",
      },
      { property: "og:title", content: "ExeCasa — today's news for your country" },
      {
        property: "og:description",
        content:
          "Daily news by country, live football scores, a find-relatives noticeboard, jobs and buy-and-sell listings.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { countryCode } = useApp();
  const country = countryByCode(countryCode);

  const news = useQuery({
    queryKey: ["news", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, category, title, summary, source, published_at")
        .eq("country_code", countryCode)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const live = useQuery({
    queryKey: ["live-top", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id, competition, home_team, home_code, away_team, away_code, home_score, away_score, minute, status, match_events(id, minute, player, team)",
        )
        .eq("status", "live")
        .order("minute", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data ?? []) as unknown as MatchRow[];
    },
  });

  const relatives = useQuery({
    queryKey: ["relatives-home", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relative_posts")
        .select("id, full_name, relation, last_seen, details, created_at")
        .eq("country_code", countryCode)
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  const listings = useQuery({
    queryKey: ["listings-home", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, kind, title, detail, price_text, location")
        .eq("country_code", countryCode)
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <TopBar />
      <SectionChips active="news" />

      {live.data?.[0] ? <div className="mt-4">{<LiveMatchCard match={live.data[0]} />}</div> : null}

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-bold">
            {country.name} today
          </p>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">
            Your daily paper
          </span>
        </div>
        <div className="space-y-2">
          {news.isLoading ? <SkeletonRows /> : null}
          {news.data?.length === 0 ? (
            <p className="glass-card rounded-2xl p-4 text-xs text-muted-foreground">
              No stories filed for {country.name} yet today.
            </p>
          ) : null}
          {news.data?.map((item) => (
            <article key={item.id} className="glass-card rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {item.category}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {timeAgo(item.published_at)}
                  {item.source ? ` · ${item.source}` : ""}
                </span>
              </div>
              <h2 className="mt-1.5 text-sm font-bold leading-snug">{item.title}</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {item.summary}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-bold">Relatives on the board</p>
          <Link to="/relatives" className="text-[11px] font-bold text-brand">
            See all
          </Link>
        </div>
        <div className="space-y-2">
          {relatives.data?.map((post) => (
            <div key={post.id} className="glass-card flex items-center gap-3 rounded-2xl p-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {initialsOf(post.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  Looking for {post.relation ? `${post.relation.toLowerCase()} ` : ""}
                  {post.full_name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {post.last_seen ?? post.details}
                </p>
              </div>
              <Link
                to="/chats"
                className="shrink-0 rounded-full bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand"
              >
                Message
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-bold">Jobs &amp; market</p>
          <Link to="/market" search={{ kind: "all" }} className="text-[11px] font-bold text-brand">
            See all
          </Link>
        </div>
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
              <p className="mt-1 text-[11px] text-muted-foreground">
                {[item.location, item.price_text].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-card h-20 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
