"use client";

import { Card } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { getTopic, reteachUrl } from "@/lib/topics";

export default function InsightsPage() {
  const { data, error } = useSnapshot();
  if (!data && !error) return <p className="text-muted">Loading insights…</p>;
  if (!data?.classroom) return <p className="text-muted">No class yet.</p>;
  if (data.user.role !== "teacher") {
    return <p>Insights are teacher-only. Classmates never see who is struggling.</p>;
  }

  const rows = data.people.map((p: { id: string; name: string; xp: number }) => {
    const opens = data.kaOpens.filter((k: { studentId: string }) => k.studentId === p.id);
    const lastOpen = opens.at(-1);
    const attempts = data.attempts.filter((a: { studentId: string }) => a.studentId === p.id);
    const lastFail = [...attempts].reverse().find((a: { passed: boolean }) => !a.passed);
    const lastPass = [...attempts].reverse().find((a: { passed: boolean }) => a.passed);
    return { p, lastOpen, lastFail, lastPass, attempts };
  });

  const rooms = data.rooms.filter((r: { status: string }) => r.status !== "complete");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Insights</h1>
      <p className="text-sm text-muted">
        Named, teacher-only. We do not import Khan Academy mastery scores.
      </p>

      <h2 className="font-black">Tables in progress</h2>
      {rooms.length === 0 ? (
        <p className="text-sm text-muted">No live labs. This is a table map, not a ranking.</p>
      ) : (
        rooms.map(
          (r: {
            id: string;
            labType: string;
            stuckConcept: string | null;
            hearts: number;
            players: { name: string }[];
            status: string;
          }) => (
            <a key={r.id} href={`/lab/${r.id}`}>
              <Card>
                <p className="font-extrabold capitalize">{r.labType.replace("_", " ")}</p>
                <p className="text-sm text-muted">{r.players.map((x) => x.name).join(", ") || "Empty"}</p>
                <p className="text-sm">
                  {r.status} · {r.hearts} hearts
                  {r.stuckConcept ? ` · stuck on ${r.stuckConcept}` : ""}
                </p>
              </Card>
            </a>
          ),
        )
      )}

      <h2 className="font-black">Per student</h2>
      {rows.map(({ p, lastOpen, lastFail, lastPass }: any) => (
        <Card key={p.id} className="flex flex-col gap-1">
          <p className="font-extrabold">{p.name}</p>
          <p className="text-sm text-muted">
            Last KA open:{" "}
            {lastOpen ? new Date(lastOpen.openedAt).toLocaleTimeString() : "Not yet"}
          </p>
          <p className="text-sm text-muted">
            Last lab: {lastPass ? "Passed" : lastFail ? `Not passed (${lastFail.conceptTag})` : "None"}
          </p>
          {lastFail ? (
            <a
              className="font-extrabold text-accent"
              href={reteachUrl(lastFail.conceptTag)}
              target="_blank"
              rel="noreferrer"
            >
              Reteach on Khan Academy
            </a>
          ) : null}
          <p className="text-sm font-bold text-primary">{p.xp} XP</p>
        </Card>
      ))}

      {data.assignments.map((a: { id: string; topicId: string }) => {
        const topic = getTopic(a.topicId);
        return (
          <p key={a.id} className="text-xs text-muted">
            Assigned: {topic?.title}
          </p>
        );
      })}
    </div>
  );
}
