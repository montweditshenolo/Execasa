import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, MicOff, PhoneOff, Heart, Users, Music, Crown, UserX, Flag } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { countryByCode, initialsOf } from "@/lib/execasa";
import { TopBar } from "@/components/execasa/TopBar";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Live voice rooms — ExeCasa" },
      {
        name: "description",
        content: "Join live voice rooms to meet, talk and connect with new friends or a soulmate in your country.",
      },
      { property: "og:title", content: "Live voice rooms — ExeCasa" },
      { property: "og:description", content: "Talk live with people in your country and make new connections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Rooms,
});

const ROOMS = [
  { id: "soulmates", name: "Soulmates", blurb: "Meet someone special", Icon: Heart },
  { id: "friends", name: "Friends lounge", blurb: "Casual chat, new friends", Icon: Users },
  { id: "music", name: "Music & vibes", blurb: "Share songs and stories", Icon: Music },
] as const;

type Member = { id: string; name: string; muted: boolean; joinedAt: number };
const REPORT_REASONS = ["Harassment or bullying", "Hate speech", "Sexual content", "Scam or asking for money", "Other"];
const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function Rooms() {
  const { countryCode, session, phone } = useApp();
  const country = countryByCode(countryCode);
  const [active, setActive] = useState<string | null>(null);
  const [removedFrom, setRemovedFrom] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  if (!session) {
    return (
      <>
        <TopBar subtitle="Voice rooms" />
        <div className="glass-card mt-4 rounded-3xl p-6 text-center">
          <p className="text-sm font-bold">Sign in to join voice rooms</p>
          <Link to="/auth" className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground">
            Continue with phone number
          </Link>
        </div>
      </>
    );
  }

  const room = ROOMS.find((r) => r.id === active);
  return (
    <>
      <TopBar subtitle={`${country.name} voice rooms`} />
      {notice ? (
        <p className="glass-card mt-4 rounded-2xl p-3 text-center text-xs font-semibold text-blush">{notice}</p>
      ) : null}
      {room ? (
        <VoiceRoom
          key={`${countryCode}-${room.id}`}
          channelName={`voice-${countryCode}-${room.id}`}
          title={`${country.flag} ${room.name}`}
          me={{ id: session.user.id, name: phone ?? "Neighbour" }}
          onLeave={(kicked) => {
            if (kicked) {
              setRemovedFrom((s) => new Set(s).add(`${countryCode}-${room.id}`));
              setNotice("The host removed you from this room.");
            }
            setActive(null);
          }}
        />
      ) : (
        <div className="mt-4 space-y-3">
          {ROOMS.map(({ id, name, blurb, Icon }) => (
            <button
              key={id}
              disabled={removedFrom.has(`${countryCode}-${id}`)}
              onClick={() => {
                setNotice(null);
                setActive(id);
              }}
              className="glass-card flex w-full items-center gap-3 rounded-3xl p-4 text-left"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-brand/15 text-brand">
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold">{name}</span>
                <span className="block text-xs text-muted-foreground">{blurb}</span>
              </span>
              <span className="rounded-full bg-pine/15 px-2.5 py-1 text-[10px] font-bold text-pine">Join</span>
            </button>
          ))}
          <p className="px-2 text-center text-[11px] text-muted-foreground">
            Be kind. Never share money or private details with people you just met.
          </p>
        </div>
      )}
    </>
  );
}

function VoiceRoom({
  channelName,
  title,
  me,
  onLeave,
}: {
  channelName: string;
  title: string;
  me: { id: string; name: string };
  onLeave: (kicked?: boolean) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<Member | null>(null);
  const [reporting, setReporting] = useState<Member | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioBox = useRef<HTMLDivElement>(null);
  const joinedAt = useRef(Date.now());
  const hostRef = useRef<string | null>(null);
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  const hostId = members.length
    ? [...members].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))[0]!.id
    : null;
  hostRef.current = hostId;
  const amHost = hostId === me.id;

  const applyMute = (next: boolean) => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
    void channelRef.current?.track({ id: me.id, name: me.name, muted: next, joinedAt: joinedAt.current });
  };
  const applyMuteRef = useRef(applyMute);
  applyMuteRef.current = applyMute;

  useEffect(() => {
    let cancelled = false;

    const send = (event: string, payload: Record<string, unknown>) =>
      channelRef.current?.send({ type: "broadcast", event, payload: { ...payload, from: me.id } });

    const closePeer = (id: string) => {
      peers.current.get(id)?.close();
      peers.current.delete(id);
      document.getElementById(`audio-${id}`)?.remove();
    };

    const getPeer = (id: string) => {
      let pc = peers.current.get(id);
      if (pc) return pc;
      pc = new RTCPeerConnection(ICE);
      streamRef.current?.getTracks().forEach((t) => pc!.addTrack(t, streamRef.current!));
      pc.onicecandidate = (e) => e.candidate && send("ice", { to: id, candidate: e.candidate.toJSON() });
      pc.ontrack = (e) => {
        let el = document.getElementById(`audio-${id}`) as HTMLAudioElement | null;
        if (!el) {
          el = document.createElement("audio");
          el.id = `audio-${id}`;
          el.autoplay = true;
          audioBox.current?.appendChild(el);
        }
        el.srcObject = e.streams[0] ?? null;
      };
      peers.current.set(id, pc);
      return pc;
    };

    (async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("Microphone access is needed to join. Please allow it and try again.");
        return;
      }
      if (cancelled) return;

      const channel = supabase.channel(channelName, { config: { presence: { key: me.id } } });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<Member>();
          const list = Object.values(state).map((arr) => arr[0]!).filter(Boolean);
          setMembers(list);
          const ids = new Set(list.map((m) => m.id));
          for (const id of peers.current.keys()) if (!ids.has(id)) closePeer(id);
          for (const m of list) {
            if (m.id !== me.id && me.id < m.id && !peers.current.has(m.id)) {
              const pc = getPeer(m.id);
              void pc.createOffer().then(async (offer) => {
                await pc.setLocalDescription(offer);
                send("offer", { to: m.id, sdp: offer });
              });
            }
          }
        })
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to !== me.id) return;
          const pc = getPeer(payload.from);
          await pc.setRemoteDescription(payload.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send("answer", { to: payload.from, sdp: answer });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to !== me.id) return;
          await peers.current.get(payload.from)?.setRemoteDescription(payload.sdp);
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (payload.to !== me.id) return;
          try {
            await peers.current.get(payload.from)?.addIceCandidate(payload.candidate);
          } catch {
            /* ignore late candidates */
          }
        })
        .on("broadcast", { event: "host-mute" }, ({ payload }) => {
          if (payload.to !== me.id || payload.from !== hostRef.current) return;
          applyMuteRef.current(true);
          setToast("The host muted you.");
        })
        .on("broadcast", { event: "kick" }, ({ payload }) => {
          if (payload.to !== me.id || payload.from !== hostRef.current) return;
          onLeaveRef.current(true);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED")
            await channel.track({ id: me.id, name: me.name, muted: false, joinedAt: joinedAt.current });
        });
    })();

    return () => {
      cancelled = true;
      for (const id of [...peers.current.keys()]) closePeer(id);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [channelName, me.id, me.name]);

  function toggleMute() {
    applyMute(!muted);
  }

  function hostAction(event: "host-mute" | "kick", m: Member) {
    void channelRef.current?.send({ type: "broadcast", event, payload: { to: m.id, from: me.id } });
    setMenuFor(null);
    setToast(event === "kick" ? `${m.name} was removed.` : `${m.name} was muted.`);
  }

  async function submitReport(m: Member, reason: string) {
    const { error: err } = await supabase.from("room_reports" as never).insert({
      reported_id: m.id,
      reported_name: m.name,
      room: channelName,
      reason,
    } as never);
    setReporting(null);
    setToast(err ? "Couldn't send report. Try again." : "Thanks — your report was sent.");
  }

  return (
    <section className="glass-card mt-4 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        <span className="rounded-full bg-pine/15 px-2.5 py-1 text-[10px] font-bold text-pine">
          {members.length} live
        </span>
      </div>

      {error ? <p className="mt-3 text-xs font-medium text-blush">{error}</p> : null}
      {toast ? (
        <button onClick={() => setToast(null)} className="mt-3 w-full rounded-xl bg-foreground/10 px-3 py-2 text-xs font-semibold">
          {toast}
        </button>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={m.id === me.id}
            onClick={() => setMenuFor(m)}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative grid size-16 place-items-center rounded-full bg-brand/15 text-sm font-bold text-brand">
              {initialsOf(m.name)}
              {m.id === hostId ? (
                <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-pine text-brand-foreground">
                  <Crown className="size-3" />
                </span>
              ) : null}
              {m.muted ? (
                <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-blush text-brand-foreground">
                  <MicOff className="size-3" />
                </span>
              ) : null}
            </div>
            <p className="max-w-full truncate text-[10px] font-semibold">
              {m.id === me.id ? (amHost ? "You · host" : "You") : m.id === hostId ? `${m.name} · host` : m.name}
            </p>
          </button>
        ))}
      </div>
      {members.length <= 1 && !error ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">Waiting for others to join…</p>
      ) : null}

      {menuFor ? (
        <div className="mt-4 space-y-2 rounded-2xl bg-foreground/5 p-3">
          <p className="text-xs font-bold">{menuFor.name}</p>
          {amHost ? (
            <>
              <button onClick={() => hostAction("host-mute", menuFor)} className="flex w-full items-center gap-2 rounded-xl bg-foreground/10 px-3 py-2 text-xs font-semibold">
                <MicOff className="size-4" /> Mute for everyone
              </button>
              <button onClick={() => hostAction("kick", menuFor)} className="flex w-full items-center gap-2 rounded-xl bg-blush/15 px-3 py-2 text-xs font-semibold text-blush">
                <UserX className="size-4" /> Remove from room
              </button>
            </>
          ) : null}
          <button
            onClick={() => {
              setReporting(menuFor);
              setMenuFor(null);
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-foreground/10 px-3 py-2 text-xs font-semibold"
          >
            <Flag className="size-4" /> Report
          </button>
          <button onClick={() => setMenuFor(null)} className="w-full text-[11px] text-muted-foreground">Cancel</button>
        </div>
      ) : null}

      {reporting ? (
        <div className="mt-4 space-y-2 rounded-2xl bg-foreground/5 p-3">
          <p className="text-xs font-bold">Why are you reporting {reporting.name}?</p>
          {REPORT_REASONS.map((r) => (
            <button key={r} onClick={() => void submitReport(reporting, r)} className="w-full rounded-xl bg-foreground/10 px-3 py-2 text-left text-xs font-semibold">
              {r}
            </button>
          ))}
          <button onClick={() => setReporting(null)} className="w-full text-[11px] text-muted-foreground">Cancel</button>
        </div>
      ) : null}

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid size-12 place-items-center rounded-full bg-foreground/10"
        >
          {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>
        <button
          onClick={() => onLeave()}
          aria-label="Leave room"
          className="grid size-12 place-items-center rounded-full bg-blush text-brand-foreground"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
      <div ref={audioBox} className="hidden" />

    </section>
  );
}
