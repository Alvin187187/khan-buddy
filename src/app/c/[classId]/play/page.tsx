"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QrCard } from "@/components/qr-card";
import { Button } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { SUBJECTS, gameTitle, getTopic } from "@/lib/topics";

export default function PlayPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const { data, error, reload } = useSnapshot(classId);
  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;

  const isTeacher = data.classroom.teacherId === data.user.id;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const live = (data.lives ?? []).find((l: { status: string }) => l.status !== "complete");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Board</h1>
      <p className="text-sm font-bold text-muted">
        {isTeacher ? "Show the PIN. They scan. You start." : "PIN's on the board. Tap Play."}
      </p>

      {live ? (
        <div className="flex flex-col gap-3">
          <p className="font-black">{gameTitle(live.topicId, live.labType)}</p>
          {isTeacher ? (
            <QrCard url={`${origin}/join?pin=${live.pin}&code=${data.classroom.code}&from=/c/${classId}`} pin={live.pin} />
          ) : (
            <div className="rounded-[12px] bg-[#1a1916] p-5 text-center text-[#f6f1e8]">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">PIN</p>
              <p className="text-4xl font-black tracking-[0.18em]">{live.pin}</p>
            </div>
          )}
          <Button onClick={() => router.push(`/play/${live.id}`)}>{isTeacher ? "Board" : "Play"}</Button>
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
        <div className="flex flex-col gap-4">
          <p className="font-bold">Nothing live. Pick a lesson.</p>
          {SUBJECTS.map((s) => (
            <section key={s.id} className="flex flex-col gap-2">
              <h2 className="font-black">{s.title}</h2>
              {s.lessons.map((id) => (
                <Link key={id} href={`/c/${classId}/l/${id}`} className="rounded-[12px] border border-line bg-surface px-4 py-3 font-extrabold">
                  {getTopic(id)?.title}
                </Link>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <p className="text-muted">Wait for the PIN on the board.</p>
      )}
    </div>
  );
}
