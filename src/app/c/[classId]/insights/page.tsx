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

  const liveNow = (data.lives ?? []).find((l: { status: string }) => l.status !== "complete");
  const last = (data.lives ?? [])[0];
  const inLast = new Set((last?.players ?? []).map((p: { userId: string }) => p.userId));
  const missed = data.attempts.filter((a: { passed: boolean }) => !a.passed);
  const tags = [...new Set(missed.map((a: { conceptTag: string }) => a.conceptTag))].slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Results</h1>
      <p className="text-sm font-bold text-muted">Who played. What to review.</p>
      {liveNow ? (
        <Link href={`/play/${liveNow.id}`} className="font-extrabold text-primary">
          Live · {gameName(liveNow.topicId)} · {liveNow.players.length}
        </Link>
      ) : null}
      {last ? (
        <Card>
          <p className="text-xs font-bold text-primary">{gameName(last.topicId)}</p>
          <p className="font-black">
            {inLast.size}/{data.people.length} played
          </p>
        </Card>
      ) : null}
      {tags.length ? (
        <div className="flex flex-col gap-2">
          <p className="font-black">Review next</p>
          {tags.map((tag) => (
            <a
              key={String(tag)}
              className="font-extrabold text-accent"
              href={reteachUrl(String(tag))}
              target="_blank"
              rel="noreferrer"
            >
              {String(tag)} · Khan Academy
            </a>
          ))}
        </div>
      ) : null}
      {data.people.map((p: { id: string; name: string; xp: number }) => {
        const opens = data.kaOpens.filter((k: { studentId: string }) => k.studentId === p.id);
        const fail = [...data.attempts].reverse().find((a: { studentId: string; passed: boolean }) => a.studentId === p.id && !a.passed);
        return (
          <Card key={p.id} className="flex flex-col gap-1">
            <p className="font-extrabold">{p.name}</p>
            <p className="text-sm text-muted">
              {last ? (inLast.has(p.id) ? "Played" : "Missed live") : ""}
              {opens.length ? " · KA" : " · no KA"} · {p.xp} XP
            </p>
            {fail ? (
              <a className="font-extrabold text-accent" href={reteachUrl(fail.conceptTag)} target="_blank" rel="noreferrer">
                Review
              </a>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
