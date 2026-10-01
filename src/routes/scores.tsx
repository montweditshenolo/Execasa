import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/execasa/TopBar";
import { SectionChips } from "@/components/execasa/SectionChips";
import { LiveMatchCard, type MatchRow } from "@/components/execasa/LiveMatchCard";

export const Route = createFileRoute("/scores")({
  head: () => ({
    meta: [
      { title: "Live scores & goals — ExeCasa" },
      {
        name: "description",
        content:
          "Follow live football results, goal scorers and match minutes across African leagues and qualifiers.",
      },
      { property: "og:title", content: "Live scores & goals — ExeCasa" },
      {
        property: "og:description",
        content: "Live results, goal scorers and match minutes, updated as matches run.",
      },
    ],
  }),
  component: Scores,
});

function Scores() {
  const matches = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id, competition, home_team, home_code, away_team, away_code, home_score, away_score, minute, status, match_events(id, minute, player, team)",
        )
        .order("status", { ascending: true })
        .order("minute", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MatchRow[];
    },
    refetchInterval: 30000,
  });

  const liveMatches = (matches.data ?? []).filter((m) => m.status === "live");
  const finished = (matches.data ?? []).filter((m) => m.status !== "live");

  return (
    <>
      <TopBar subtitle="Scores, goals and results" />
      <SectionChips active="sports" />

      <section className="mt-4 space-y-3">
        <p className="px-1 text-sm font-bold">Playing now</p>
        {matches.isLoading ? <div className="glass-card h-32 animate-pulse rounded-3xl" /> : null}
        {liveMatches.map((match) => (
          <LiveMatchCard key={match.id} match={match} />
        ))}
        {!matches.isLoading && liveMatches.length === 0 ? (
          <p className="glass-card rounded-2xl p-4 text-xs text-muted-foreground">
            No matches kicking off right now.
          </p>
        ) : null}
      </section>

      {finished.length > 0 ? (
        <section className="mt-4 space-y-3">
          <p className="px-1 text-sm font-bold">Latest results</p>
          {finished.map((match) => (
            <LiveMatchCard key={match.id} match={match} />
          ))}
        </section>
      ) : null}
    </>
  );
}
