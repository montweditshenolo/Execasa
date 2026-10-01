import { Link } from "@tanstack/react-router";

const chipBase = "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors";

export function SectionChips({ active }: { active: "news" | "sports" | "relatives" | "jobs" | "market" }) {
  const chip = (key: string) =>
    key === active
      ? `${chipBase} bg-ink text-brand-foreground shadow-md`
      : `${chipBase} glass-panel text-foreground/70`;

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      <Link to="/" className={chip("news")}>
        News
      </Link>
      <Link to="/scores" className={chip("sports")}>
        Sports
      </Link>
      <Link to="/relatives" className={chip("relatives")}>
        Relatives
      </Link>
      <Link to="/market" search={{ kind: "job" }} className={chip("jobs")}>
        Jobs
      </Link>
      <Link to="/market" search={{ kind: "all" }} className={chip("market")}>
        Market
      </Link>
    </div>
  );
}
