"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSnapshot } from "@/hooks/use-snapshot";
import { SUBJECTS, gameTitle, getTopic } from "@/lib/topics";

export default function LessonsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, error } = useSnapshot(classId);
  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;

  const live = (data.lives ?? []).find((l: { status: string }) => l.status !== "complete");
  const pairs = (data.announcements ?? []).filter((a: { body: string }) => a.body.startsWith("Pair ·"));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-12 w-auto" />
        <div>
          <h1 className="text-2xl font-black leading-tight">{data.classroom.name}</h1>
          <p className="text-sm font-bold text-muted">Code {data.classroom.code}</p>
        </div>
      </div>
      <p className="text-sm font-extrabold text-primary">Read it. Board it. They play.</p>

      {live ? (
        <Link href={`/play/${live.id}`} className="rounded-[12px] bg-foreground px-4 py-4 text-background">
          <p className="text-sm font-bold">On the board</p>
          <p className="text-xl font-black">{gameTitle(live.topicId, live.labType)}</p>
          <p className="mt-1 text-3xl font-black tracking-[0.12em]">{live.pin}</p>
        </Link>
      ) : null}

      {SUBJECTS.map((s) => (
        <section key={s.id} className="flex flex-col gap-2">
          <h2 className="text-lg font-black">{s.title}</h2>
          {s.lessons.map((id) => {
            const t = getTopic(id);
            if (!t) return null;
            return (
              <Link
                key={id}
                href={`/c/${classId}/l/${id}`}
                className="rounded-[12px] border border-line bg-surface px-4 py-4"
              >
                <p className="text-lg font-black">{t.title}</p>
                <p className="mt-1 text-sm text-muted">{t.playPrompt}</p>
              </Link>
            );
          })}
        </section>
      ))}

      {pairs.slice(0, 3).map((a: { id: string; body: string }) => (
        <p key={a.id} className="text-sm font-bold">
          {a.body.replace("Pair · ", "")}
        </p>
      ))}
    </div>
  );
}
