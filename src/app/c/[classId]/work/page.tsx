"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { TOPICS, gameName, getTopic } from "@/lib/topics";

export default function WorkPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, error, reload } = useSnapshot(classId);
  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;
  const isTeacher = data.classroom.teacherId === data.user.id;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Work</h1>
      {isTeacher
        ? TOPICS.map((t) => (
            <button
              key={t.id}
              className="flex min-h-14 flex-col items-start rounded-[12px] border border-line bg-surface px-3 py-2 text-left"
              onClick={async () => {
                await rpc("assign", { classroomId: classId, topicId: t.id });
                reload();
              }}
            >
              <span className="font-extrabold">{t.title}</span>
              <span className="text-xs text-muted">{gameName(t.id)}</span>
            </button>
          ))
        : null}
      {data.assignments.map((a: { id: string; topicId: string }) => {
        const topic = getTopic(a.topicId);
        if (!topic) return null;
        return (
          <Card key={a.id} className="flex flex-col gap-2">
            <p className="font-black">{topic.title}</p>
            <a
              href={topic.kaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-accent font-extrabold text-white"
              onClick={() => rpc("openKa", { assignmentId: a.id })}
            >
              Khan Academy
            </a>
            <a href={`/c/${classId}/play`} className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-line font-extrabold">
              {gameName(topic.id)}
            </a>
          </Card>
        );
      })}
    </div>
  );
}
