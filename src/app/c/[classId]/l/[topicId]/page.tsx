"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { getTopic } from "@/lib/topics";

export default function LessonPage() {
  const { classId, topicId } = useParams<{ classId: string; topicId: string }>();
  const router = useRouter();
  const topic = getTopic(topicId);
  const { data, reload } = useSnapshot(classId);
  const [showHint, setShowHint] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [msg, setMsg] = useState("");

  if (!topic) return <p>Missing lesson.</p>;
  const isTeacher = data?.classroom?.teacherId === data?.user?.id;
  const live = (data?.lives ?? []).find(
    (l: { status: string; topicId: string }) => l.status !== "complete" && l.topicId === topic.id,
  );

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/c/${classId}`} className="text-sm font-bold text-muted">
        ← {topic.subject}
      </Link>
      <div>
        <p className="text-xs font-bold text-primary">{topic.subject}</p>
        <h1 className="text-2xl font-black">{topic.title}</h1>
      </div>

      <ol className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
        {["1 Read", "2 Board", "3 Play"].map((s) => (
          <li key={s} className="rounded-[8px] bg-highlight px-2 py-3 text-primary">
            {s}
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-4">
        {topic.points.map((p) => (
          <p key={p} className="text-[15px] leading-6">
            {p}
          </p>
        ))}
        <p className="pt-2 font-extrabold">{topic.check}</p>
        <button className="self-start text-sm font-extrabold text-primary" onClick={() => setShowHint(true)}>
          Hint
        </button>
        {showHint ? <p className="text-sm">{topic.hint}</p> : null}
        <a
          href={topic.kaUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-12 items-center justify-center rounded-[8px] bg-accent font-extrabold text-white"
          onClick={() => {
            const assignment = data?.assignments?.find((x: { topicId: string }) => x.topicId === topic.id);
            if (assignment) rpc("openKa", { assignmentId: assignment.id }).catch(() => {});
          }}
        >
          Khan Academy
        </a>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-black">Games</h2>
        {topic.games.map((g) => (
          <div key={g.name} className="rounded-[12px] border border-line bg-surface p-3">
            <p className="font-extrabold">{g.name}</p>
            <p className="text-sm text-muted">{g.line}</p>
            {isTeacher ? (
              <Button
                className="mt-3 w-full"
                onClick={async () => {
                  await rpc("assign", { classroomId: classId, topicId: topic.id }).catch(() => {});
                  const s = await rpc<{ id: string }>("createLive", {
                    classroomId: classId,
                    topicId: topic.id,
                    labType: g.labType,
                  });
                  router.push(`/play/${s.id}`);
                }}
              >
                On the board
              </Button>
            ) : null}
          </div>
        ))}
        {!isTeacher && live ? (
          <Button onClick={() => router.push(`/play/${live.id}`)}>Join {live.pin}</Button>
        ) : null}
        {!isTeacher && !live ? <p className="text-sm text-muted">Wait for the board.</p> : null}
      </section>

      {isTeacher && data?.people ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-black">Study pair</h2>
          <select className="min-h-11 rounded-[8px] border border-line bg-surface px-2" value={a} onChange={(e) => setA(e.target.value)}>
            <option value="">Student A</option>
            {data.people.map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="min-h-11 rounded-[8px] border border-line bg-surface px-2" value={b} onChange={(e) => setB(e.target.value)}>
            <option value="">Student B</option>
            {data.people.map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          {msg ? <p className="text-sm font-bold text-danger">{msg}</p> : null}
          <Button
            variant="secondary"
            onClick={async () => {
              if (!a || !b || a === b) {
                setMsg("Pick two different students.");
                return;
              }
              try {
                await rpc("announce", { classroomId: classId, body: `Pair · ${topic.title} · ${a} + ${b}` });
                setMsg("");
                reload();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "Could not save");
              }
            }}
          >
            Approve pair
          </Button>
        </section>
      ) : null}
    </div>
  );
}
