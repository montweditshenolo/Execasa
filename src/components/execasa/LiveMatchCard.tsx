export type MatchEvent = {
  id: string;
  minute: number;
  player: string;
  team: string;
};

export type MatchRow = {
  id: string;
  competition: string;
  home_team: string;
  home_code: string;
  away_team: string;
  away_code: string;
  home_score: number;
  away_score: number;
  minute: number;
  status: string;
  match_events?: MatchEvent[] | null;
};

export function LiveMatchCard({ match }: { match: MatchRow }) {
  const events = [...(match.match_events ?? [])].sort((a, b) => a.minute - b.minute);
  const live = match.status === "live";

  return (
    <section className="glass-card rounded-3xl p-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {live ? <span className="size-2 animate-pulse rounded-full bg-blush" /> : null}
          <p className="text-xs font-bold uppercase tracking-wide">
            {live ? "Live" : "Full time"}
          </p>
        </div>
        <p className="text-[10px] font-medium text-muted-foreground">
          {match.competition} · {live ? `${match.minute}'` : "90'"}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-2xl bg-glass-strong px-4 py-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
            {match.home_code}
          </div>
          <p className="truncate text-sm font-bold">{match.home_team}</p>
        </div>
        <div className="mx-3 shrink-0 text-2xl font-extrabold tracking-tight">
          {match.home_score}&thinsp;:&thinsp;{match.away_score}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <p className="truncate text-sm font-bold">{match.away_team}</p>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-blush/15 text-[10px] font-bold text-blush">
            {match.away_code}
          </div>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="mt-2 space-y-1.5 px-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 text-[11px] font-medium text-foreground/70"
            >
              <span
                className={
                  event.team === match.home_team
                    ? "size-1.5 rounded-full bg-pine"
                    : "size-1.5 rounded-full bg-blush"
                }
              />
              GOAL {event.minute}' {event.player} — {event.team}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 px-1 text-[11px] font-medium text-muted-foreground">No goals yet</p>
      )}
    </section>
  );
}
