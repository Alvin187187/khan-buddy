"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { gameName, reteachUrl } from "@/lib/topics";

export default function InsightsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, error } = useSnapshot(classId);
  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;
  if (data.classroom.teacherId !== data.user.id) return <p>Teacher only.</p>;

  const live = (data.lives ?? []).find((l: { status: string }) => l.status !== "complete");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Results</h1>
      {live ? (
        <Link href={`/play/${live.id}`} className="font-extrabold text-primary">
          Live · {gameName(live.topicId)} · {live.players.length}
        </Link>
      ) : null}
      {data.people.map((p: { id: string; name: string; xp: number }) => {
        const opens = data.kaOpens.filter((k: { studentId: string }) => k.studentId === p.id);
        const attempts = data.attempts.filter((a: { studentId: string }) => a.studentId === p.id);
        const lastFail = [...attempts].reverse().find((a: { passed: boolean }) => !a.passed);
        return (
          <Card key={p.id} className="flex flex-col gap-1">
            <p className="font-extrabold">{p.name}</p>
            <p className="text-sm text-muted">{opens.length ? "Opened KA" : "No KA"} · {p.xp} XP</p>
            {lastFail ? (
              <a className="font-extrabold text-accent" href={reteachUrl(lastFail.conceptTag)} target="_blank" rel="noreferrer">
                Review
              </a>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
