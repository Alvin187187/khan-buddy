"use client";

import { useParams, useRouter } from "next/navigation";
import { QrCard } from "@/components/qr-card";
import { Button } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { TOPICS, gameName } from "@/lib/topics";

export default function PlayPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const { data, error, reload } = useSnapshot(classId);
  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;

  const isTeacher = data.classroom.teacherId === data.user.id;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const live = (data.lives ?? []).find((l: { status: string }) => l.status !== "complete");
  const games = TOPICS.filter((t) => t.liveOk);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Play</h1>

      {live ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-primary">{gameName(live.topicId)}</p>
          {isTeacher ? (
            <QrCard url={`${origin}/join?pin=${live.pin}&from=/c/${classId}`} pin={live.pin} />
          ) : (
            <p className="text-3xl font-black tracking-[0.18em]">{live.pin}</p>
          )}
          <Button onClick={() => router.push(`/play/${live.id}`)}>
            {isTeacher ? "Host" : "Enter"}
          </Button>
          {isTeacher ? (
            <Button
              variant="secondary"
              onClick={async () => {
                await rpc("endLive", { sessionId: live.id });
                reload();
              }}
            >
              New game
            </Button>
          ) : null}
        </div>
      ) : isTeacher ? (
        <div className="grid gap-2">
          {games.map((t) => (
            <button
              key={t.id}
              className="flex min-h-14 flex-col items-start rounded-[12px] border border-line bg-surface px-3 py-2 text-left"
              onClick={async () => {
                const s = await rpc<{ id: string }>("createLive", { classroomId: classId, topicId: t.id });
                router.push(`/play/${s.id}`);
              }}
            >
              <span className="font-extrabold">{gameName(t.id)}</span>
              <span className="text-xs text-muted">{t.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted">Wait for the PIN.</p>
      )}
    </div>
  );
}
