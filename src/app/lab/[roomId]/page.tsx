"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { CellLab } from "@/components/cell-lab";
import { FunctionLab } from "@/components/function-lab";
import { QrCard } from "@/components/qr-card";
import { Button, Card } from "@/components/ui";
import { useRoom } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { reteachUrl } from "@/lib/topics";
import { Heart } from "lucide-react";

export default function LabPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { data, error, reload } = useRoom(roomId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    rpc("joinRoom", { roomId }).then(() => reload()).catch(() => {});
  }, [roomId, reload]);

  const you = data?.you?.id as string | undefined;
  const myPlayer = data?.players?.find((p: { userId: string }) => p.userId === you);
  const isTeacher = data && you && !myPlayer;
  const canPlay = Boolean(myPlayer) && data?.room.status === "playing";

  const hearts = useMemo(() => {
    const n = data?.room.hearts ?? 0;
    return Array.from({ length: 3 }, (_, i) => i < n);
  }, [data?.room.hearts]);

  if (error) {
    return (
      <div className="p-5">
        <p className="font-bold text-danger">{error}</p>
        <button className="mt-3 font-bold" onClick={() => router.push("/login")}>
          Sign in
        </button>
      </div>
    );
  }
  if (!data) return <p className="p-5 text-muted">Opening table…</p>;

  const { room, topic, players } = data;
  const min = topic?.partyMin ?? 2;
  const max = topic?.partyMax ?? 5;

  return (
    <div id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-4 pb-[env(safe-area-inset-bottom)]">
      <button className="text-left text-sm font-bold text-muted" onClick={() => router.push("/class/labs")}>
        ← Tables
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-primary">{topic?.subject}</p>
          <h1 className="text-2xl font-black">{topic?.title}</h1>
          <p className="text-sm text-muted">
            Level {(room.levelIndex ?? 0) + 1} · {players.length}/{max} seated
          </p>
        </div>
        <div className="flex items-center gap-1" aria-live="polite" aria-label={`${data?.room.hearts ?? 0} hearts left`}>
          {hearts.map((on, i) => (
            <Heart key={i} fill={on ? "#0f766e" : "transparent"} color="#0f766e" aria-hidden />
          ))}
          <span className="text-xs font-bold text-muted">{data?.room.hearts ?? 0} hearts</span>
        </div>
      </div>

      {room.status === "lobby" ? (
        <>
          <Card>
            <p className="font-extrabold">Waiting for buddies</p>
            <p className="text-sm text-muted">Need {min} signed-in students. Max {max}.</p>
            <ul className="mt-2 text-sm">
              {players.map((p: { userId: string; name: string; roleKey: string }) => (
                <li key={p.userId}>
                  {p.name} · {p.roleKey}
                </li>
              ))}
            </ul>
          </Card>
          <QrCard url={`${origin}/lab/${room.id}`} label="Scan to sit at this table" />
          <Button
            disabled={players.length < min}
            onClick={() => rpc("startRoom", { roomId: room.id })}
          >
            Start lab
          </Button>
        </>
      ) : null}

      {room.status === "playing" && room.labType === "function_machine" ? (
        <FunctionLab
          roomId={room.id}
          sim={room.sim}
          levelIndex={room.levelIndex}
          roleKey={myPlayer?.roleKey ?? "observe"}
          canPlay={canPlay}
        />
      ) : null}

      {room.status === "playing" && room.labType === "cell_builder" ? (
        <CellLab
          roomId={room.id}
          sim={room.sim}
          roleKey={myPlayer?.roleKey ?? "observe"}
          canPlay={canPlay}
          levelIndex={room.levelIndex}
        />
      ) : null}

      {isTeacher && room.status === "playing" ? (
        <p className="text-sm text-muted">You are observing. Students keep the roles.</p>
      ) : null}

      {room.status === "complete" ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-black">{room.hearts === 0 ? "Out of hearts" : "Table complete"}</h2>
          {room.stuckConcept ? (
            <>
              <p className="text-sm">Stuck on {room.stuckConcept}. Reteach on Khan Academy — teacher-only insights stay private.</p>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-accent font-extrabold text-white"
                href={reteachUrl(room.stuckConcept)}
                target="_blank"
                rel="noreferrer"
              >
                Open reteach on Khan Academy
              </a>
            </>
          ) : (
            <p className="text-sm">Squad XP is on each signed-in account. Next: another KA unit.</p>
          )}
          <Button variant="secondary" onClick={() => router.push("/class")}>
            Back to class
          </Button>
        </Card>
      ) : null}

      {topic ? (
        <a className="text-sm font-extrabold text-accent" href={topic.kaUrl} target="_blank" rel="noreferrer">
          Khan Academy unit
        </a>
      ) : null}
    </div>
  );
}
