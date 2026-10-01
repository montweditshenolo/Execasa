import { Link } from "@tanstack/react-router";
import { Newspaper, Trophy, Users, Store, MessageCircle, Heart } from "lucide-react";

const tabs = [
  { to: "/", label: "News", Icon: Newspaper },
  { to: "/scores", label: "Scores", Icon: Trophy },
  { to: "/relatives", label: "Relatives", Icon: Users },
  { to: "/market", label: "Market", Icon: Store },
  { to: "/chats", label: "Chats", Icon: MessageCircle },
  { to: "/soulmates", label: "Soulmate", Icon: Heart },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div
        className="glass-panel mx-auto flex max-w-[430px] items-center gap-1 rounded-none border-x-0 border-b-0 px-3 py-2.5"
        style={{ boxShadow: "var(--shadow-nav)" }}
      >
        {tabs.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            search={to === "/market" ? { kind: "all" } : {}}
            aria-label={label}
            className="grid flex-1 place-items-center py-1 text-foreground/40"
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "grid flex-1 place-items-center py-1 text-brand" }}
          >
            <span className="grid size-9 place-items-center rounded-xl">
              <Icon className="size-5" strokeWidth={2.2} />
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
