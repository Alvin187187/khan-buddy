"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppChrome } from "@/components/app-chrome";
import { GameBoard } from "@/components/games";
import { Button } from "@/components/ui";
import { useRoom } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { gameName } from "@/lib/topics";

export default function LabPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { data, error, reload } = useRoom(roomId);
  const stored = typeof window !== "undefined" ? localStorage.getItem("kb-class") ?? undefined : undefined;

  useEffect(() => {
    rpc("joinRoom", { roomId }).then(() => reload()).catch(() => {});
  }, [roomId, reload]);

  const classId = (data?.room?.classroom_id as string | undefined) ?? stored;

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

  const { room, topic, players, you } = data;
  const myPlayer = players.find((p: { userId: string }) => p.userId === you.id);
  const canPlay = Boolean(myPlayer) && room.status === "playing";

  return (
    <AppChrome classId={classId}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black">{topic ? gameName(topic.id) : "Lab"}</h1>
        {room.status === "lobby" ? (
          <>
            <ul className="text-sm font-bold">
              {players.map((p: { userId: string; name: string }) => (
                <li key={p.userId}>{p.name}</li>
              ))}
            </ul>
            <Button onClick={() => rpc("startRoom", { roomId: room.id })}>Start</Button>
          </>
        ) : null}
        {room.status === "playing" ? (
          <GameBoard
            labType={room.labType}
            roomId={room.id}
            sim={room.sim}
            roleKey={myPlayer?.roleKey ?? "observe"}
            canPlay={canPlay}
            levelIndex={room.levelIndex}
          />
        ) : null}
        {room.status === "complete" ? (
          <Button variant="secondary" onClick={() => router.push(`/c/${classId}/play`)}>
            Play
          </Button>
        ) : null}
      </div>
    </AppChrome>
  );
}
