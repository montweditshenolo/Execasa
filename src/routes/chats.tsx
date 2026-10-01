import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SendHorizontal } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { countryByCode, initialsOf } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Community chat — ExeCasa" },
      {
        name: "description",
        content:
          "Chat with people in your country: share news, ask about relatives, follow up on jobs and listings, and make friends.",
      },
      { property: "og:title", content: "Community chat — ExeCasa" },
      {
        property: "og:description",
        content: "A live text chat room for each country inside ExeCasa.",
      },
    ],
  }),
  component: Chats,
});

function Chats() {
  const { countryCode, session, phone } = useApp();
  const country = countryByCode(countryCode);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ["messages", countryCode],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("messages")
        .select("id, author_id, author_name, body, created_at")
        .eq("channel", countryCode)
        .order("created_at", { ascending: true })
        .limit(200);
      if (queryError) throw queryError;
      return data;
    },
  });

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`messages-${countryCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel=eq.${countryCode}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", countryCode] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [countryCode, queryClient, session]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
    inputRef.current?.focus();
  }, [messages.data]);

  async function send() {
    const body = draft.trim();
    if (!body || !session) return;
    setDraft("");
    const { error: insertError } = await supabase.from("messages").insert({
      author_id: session.user.id,
      author_name: phone ?? "Neighbour",
      channel: countryCode,
      body,
    });
    if (insertError) setError(insertError.message);
    else {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["messages", countryCode] });
    }
    inputRef.current?.focus();
  }

  if (!session) {
    return (
      <>
        <TopBar subtitle="Community chat" />
        <div className="glass-card mt-4 rounded-3xl p-6 text-center">
          <p className="text-sm font-bold">Sign in to join the chat</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Chats use your phone number so neighbours know who they are talking to.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
          >
            Continue with phone number
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar subtitle={`${country.name} chat room`} />

      <Link
        to="/rooms"
        className="glass-card mt-4 flex items-center justify-between rounded-3xl p-4"
      >
        <span>
          <span className="block text-sm font-bold">Live voice rooms</span>
          <span className="block text-xs text-muted-foreground">Talk live with new friends or a soulmate</span>
        </span>
        <span className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-brand-foreground">Join</span>
      </Link>

      <section className="glass-card mt-4 flex min-h-[60vh] flex-col rounded-3xl p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-sm font-bold">
            {country.flag} {country.name} room
          </p>
          <span className="rounded-full bg-pine/15 px-2.5 py-1 text-[10px] font-bold text-pine">
            Live
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {messages.data?.map((message) => {
            const mine = message.author_id === session.user.id;
            return (
              <div
                key={message.id}
                className={mine ? "flex justify-end gap-2" : "flex items-start gap-2"}
              >
                {!mine ? (
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
                    {initialsOf(message.author_name ?? "Neighbour")}
                  </div>
                ) : null}
                <div
                  className={
                    mine
                      ? "max-w-[75%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-xs font-medium text-brand-foreground"
                      : "max-w-[75%] rounded-2xl rounded-bl-sm bg-glass-strong px-3 py-2 text-xs font-medium"
                  }
                >
                  {!mine ? (
                    <p className="mb-0.5 text-[10px] font-bold text-muted-foreground">
                      {message.author_name ?? "Neighbour"}
                    </p>
                  ) : null}
                  {message.body}
                </div>
              </div>
            );
          })}
          {(messages.data?.length ?? 0) === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No messages yet. Say hello to {country.name}.
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        {error ? <p className="px-1 pt-2 text-[11px] font-medium text-blush">{error}</p> : null}

        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            className="flex-1 rounded-xl bg-foreground/5 px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground"
          >
            <SendHorizontal className="size-4" />
          </button>
        </form>
      </section>
    </>
  );
}
