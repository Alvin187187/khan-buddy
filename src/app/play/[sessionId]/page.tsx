"use client";

import { useParams } from "next/navigation";
import { AppChrome } from "@/components/app-chrome";
import { GameBoard } from "@/components/games";
import { QrCard } from "@/components/qr-card";
import { Button } from "@/components/ui";
import { useLive } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { gameName } from "@/lib/topics";

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

  return (
    <AppChrome classId={session.classroomId}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black">{gameName(session.topicId)}</h1>

        {session.status === "lobby" ? (
          <>
            {isHost ? (
              <QrCard url={`${origin}/join?pin=${session.pin}&from=/c/${session.classroomId}`} pin={session.pin} />
            ) : (
              <p className="text-4xl font-black tracking-[0.18em]">{session.pin}</p>
            )}
            <ul className="text-sm font-bold">
              {players.map((p: { userId: string; name: string }) => (
                <li key={p.userId}>{p.name}</li>
              ))}
            </ul>
            {isHost ? (
              <Button onClick={() => rpc("startLive", { sessionId: session.id })}>Start</Button>
            ) : (
              <p className="text-muted">Wait.</p>
            )}
          </>
        ) : null}

        {session.status === "playing" ? (
          <GameBoard
            labType={session.labType}
            roomId={session.id}
            sim={session.sim}
            roleKey={myPlayer?.roleKey ?? "observe"}
            canPlay={canPlay || (isHost && session.labType !== "concept_sketch")}
            levelIndex={0}
            live
          />
        ) : null}

        {session.status === "complete" ? (
          <div className="flex flex-col gap-3">
            <p className="text-xl font-black">Done</p>
            {topic ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-accent font-extrabold text-white"
                href={topic.kaUrl}
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
