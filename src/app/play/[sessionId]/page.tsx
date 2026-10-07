"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppChrome } from "@/components/app-chrome";
import { GameBoard } from "@/components/games";
import { QrCard } from "@/components/qr-card";
import { Button } from "@/components/ui";
import { useLive } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { gameTitle, reteachUrl } from "@/lib/topics";

const CHIP = ["#0f766e", "#1865f2", "#c45c26", "#5b4bb4", "#e21b3c", "#d89e00"];

export default function PlaySessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, error } = useLive(sessionId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const stored = typeof window !== "undefined" ? localStorage.getItem("kb-class") ?? undefined : undefined;
  const classId = data?.session?.classroomId ?? stored;

  if (error) {
    return (
      <AppChrome classId={classId}>
        <p className="font-bold text-danger">{error}</p>
      </AppChrome>
    );
  }
  if (!data) {
    return (
      <AppChrome classId={classId}>
        <p className="text-muted">Loading…</p>
      </AppChrome>
    );
  }

  const { session, topic, players, you } = data;
  const isHost = you.id === session.hostId || you.role === "teacher";
  const myPlayer = players.find((p: { userId: string }) => p.userId === you.id);
  const canPlay = Boolean(myPlayer) && session.status === "playing";
  const podium = [...players].sort((a: { score: number }, b: { score: number }) => b.score - a.score).slice(0, 3);
  const stuck = (session.sim as { failTag?: string })?.failTag;

  return (
    <AppChrome classId={session.classroomId}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black">{gameTitle(session.topicId, session.labType)}</h1>

        {session.status === "lobby" ? (
          <>
            <div className="rounded-[12px] bg-[#1a1916] p-5 text-center text-[#f6f1e8]">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">Game PIN</p>
              <p className="mt-1 text-5xl font-black tracking-[0.2em]">{session.pin}</p>
              <p className="mt-3 text-sm">{players.length} in · scan, then start</p>
            </div>
            {isHost ? (
              <QrCard url={`${origin}/join?pin=${session.pin}&code=${session.classroomCode ?? ""}&from=/c/${session.classroomId}`} />
            ) : null}
            <div className="flex flex-wrap gap-2">
              {players.map((p: { userId: string; name: string }, i: number) => (
                <span
                  key={p.userId}
                  className="rounded-[8px] px-3 py-2 text-sm font-extrabold text-white"
                  style={{ background: CHIP[i % CHIP.length] }}
                >
                  {p.name}
                </span>
              ))}
            </div>
            {isHost ? (
              <Button onClick={() => rpc("startLive", { sessionId: session.id })}>Start</Button>
            ) : (
              <p className="font-bold">You're in. Eyes on the board.</p>
            )}
          </>
        ) : null}

        {session.status === "playing" ? (
          <GameBoard
            labType={session.labType}
            roomId={session.id}
            sim={session.sim}
            roleKey={myPlayer?.roleKey ?? "observe"}
            canPlay={canPlay}
            levelIndex={0}
            live
            board={isHost}
          />
        ) : null}

        {session.status === "complete" ? (
          <div className="flex flex-col gap-3">
            <p className="text-xl font-black">Round over</p>
            {podium.map((p: { userId: string; name: string; score: number }, i: number) => (
              <p key={p.userId} className="font-extrabold">
                {i + 1}. {p.name} · {p.score}
              </p>
            ))}
            {isHost ? (
              <Link href={`/c/${session.classroomId}/insights`} className="font-extrabold text-primary">
                See who missed
              </Link>
            ) : null}
            {topic ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-accent font-extrabold text-white"
                href={stuck ? reteachUrl(String(stuck)) : topic.kaUrl}
                target="_blank"
                rel="noreferrer"
              >
                Khan Academy
              </a>
            ) : null}
          </div>
        ) : null}

        {isHost && session.status === "playing" ? (
          <Button variant="ghost" onClick={() => rpc("endLive", { sessionId: session.id })}>
            End
          </Button>
        ) : null}
      </div>
    </AppChrome>
  );
}
