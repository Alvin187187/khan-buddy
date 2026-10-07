"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { QrCard } from "@/components/qr-card";
import { Button, Card, Input } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { gameName, getTopic } from "@/lib/topics";

export default function StreamPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, error, reload } = useSnapshot(classId);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");

  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;

  const { user, classroom } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const isTeacher = classroom.teacherId === user.id;
  const live = (data.lives ?? []).find((l: { status: string }) => l.status !== "complete");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black">{classroom.name}</h1>
        <p className="text-sm font-black tracking-wide">{classroom.code}</p>
      </div>

      {isTeacher ? (
        <QrCard url={`${origin}/join?code=${classroom.code}&from=/c/${classId}`} pin={classroom.code} />
      ) : null}

      {live ? (
        <Button onClick={() => (window.location.href = `/play/${live.id}`)}>
          Live · {gameName(live.topicId)}
        </Button>
      ) : null}

      {isTeacher ? (
        <div className="flex flex-col gap-2">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Announcement" />
          {msg ? <p className="text-sm font-bold text-danger">{msg}</p> : null}
          <Button
            onClick={async () => {
              try {
                await rpc("announce", { classroomId: classId, body });
                setBody("");
                reload();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "Could not post");
              }
            }}
          >
            Post
          </Button>
        </div>
      ) : null}

      {(data.announcements ?? []).map((a: { id: string; body: string; createdAt: string }) => (
        <Card key={a.id}>
          <p className="text-sm leading-6">{a.body}</p>
          <p className="mt-2 text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</p>
        </Card>
      ))}

      {(data.assignments ?? []).map((a: { id: string; topicId: string }) => {
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
            <a
              href={`/c/${classId}/play`}
              className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-line font-extrabold"
            >
              {gameName(topic.id)}
            </a>
          </Card>
        );
      })}
    </div>
  );
}
