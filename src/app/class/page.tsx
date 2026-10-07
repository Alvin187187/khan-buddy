"use client";

import { useState } from "react";
import { Button, Card, Field, Input, Mark } from "@/components/ui";
import { QrCard } from "@/components/qr-card";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { TOPICS, getTopic } from "@/lib/topics";
import { ExternalLink } from "lucide-react";

export default function StreamPage() {
  const { data, error, reload } = useSnapshot();
  const [name, setName] = useState("STEM 11");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  if (!data && !error) return <p className="text-muted">Loading class…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;

  const user = data.user;
  const classroom = data.classroom;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (!classroom && user.role === "teacher") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black">Create your one classroom</h1>
        <p className="text-muted">Like Google Classroom — one class per teacher in this version.</p>
        <Field label="Class name" htmlFor="cname">
          <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        {msg ? (
          <p role="alert" className="text-sm font-bold text-danger">
            {msg}
          </p>
        ) : null}
        <Button
          onClick={async () => {
            try {
              await rpc("createClassroom", { name });
              reload();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Could not create class");
            }
          }}
        >
          Create class
        </Button>
      </div>
    );
  }

  if (!classroom && user.role === "student") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black">Join your class</h1>
        <p className="text-muted">Ask your teacher for the 6-letter code, or scan their QR.</p>
        <Field label="Class code" htmlFor="code">
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
        </Field>
        <Button
          onClick={async () => {
            try {
              await rpc("joinClassroom", { code });
              reload();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Could not join");
            }
          }}
        >
          Join class
        </Button>
        {msg ? (
          <p role="alert" className="text-sm font-bold text-danger">
            {msg}
          </p>
        ) : null}
      </div>
    );
  }

  const assignments = [...data.assignments].reverse();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black">{classroom.name}</h1>
        <p className="text-sm text-muted">
          Class code{" "}
          <span className="font-black text-foreground" aria-label={`Class code ${classroom.code}`}>
            {classroom.code}
          </span>
          {user.role === "teacher" ? (
            <button
              className="ml-2 min-h-11 text-sm font-extrabold text-primary"
              onClick={() => navigator.clipboard.writeText(classroom.code)}
            >
              Copy code
            </button>
          ) : null}
        </p>
      </div>

      {user.role === "teacher" && !classroom.kaSetupComplete ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-black">Set up Khan Academy for this class</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-6">
            <li>Create a free teacher account on khanacademy.org if you do not have one.</li>
            <li>Ask students to create free KA accounts (also free).</li>
            <li>
              Assign SHS units from Khan Academy Philippines — Buddy stores the official URLs, never
              KA passwords.
            </li>
          </ol>
          <a
            className="inline-flex min-h-11 items-center gap-2 font-extrabold text-accent"
            href="https://www.khanacademy.org/"
            target="_blank"
            rel="noreferrer"
          >
            Open Khan Academy <ExternalLink />
          </a>
          <Button onClick={async () => { await rpc("kaSetup"); reload(); }}>
            We use Khan Academy in this class
          </Button>
        </Card>
      ) : null}

      {user.role === "student" ? (
        <Card>
          <h2 className="text-lg font-black">Introduce Khan Academy</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This class learns on <Mark>Khan Academy</Mark> — free lessons and practice. Open the
            assigned unit there first. Then come back for a peer lab with classmates.
          </p>
        </Card>
      ) : null}

      {user.role === "teacher" ? (
        <QrCard
          url={`${origin}/join?code=${classroom.code}`}
          label="Students scan to join this class"
        />
      ) : null}

      {user.role === "teacher" ? (
        <Card className="flex flex-col gap-3">
          <h2 className="font-black">Assign a Khan Academy unit + Buddy lab</h2>
          <div className="flex flex-col gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                className="flex min-h-14 flex-col items-start rounded-[8px] border border-line px-3 py-2 text-left"
                onClick={async () => {
                  await rpc("assign", { topicId: t.id });
                  reload();
                }}
              >
                <span className="text-xs font-bold text-primary">{t.subject}</span>
                <span className="font-extrabold">{t.title}</span>
                <span className="text-xs text-muted">
                  Lab for {t.partyMin === t.partyMax ? t.partyMin : `${t.partyMin}–${t.partyMax}`}{" "}
                  students
                </span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <h2 className="font-black">Stream</h2>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted">No assignments yet. Teachers post a KA unit here.</p>
      ) : (
        assignments.map((a: { id: string; topicId: string; labType: string }) => {
          const topic = getTopic(a.topicId);
          if (!topic) return null;
          return (
            <Card key={a.id} className="flex flex-col gap-3">
              <p className="text-xs font-bold text-primary">{topic.subject}</p>
              <h3 className="text-lg font-black">{topic.title}</h3>
              <p className="text-sm text-muted">
                1. Learn on Khan Academy. 2. Peer lab (
                {topic.partyMin === 2 ? "2 players" : "3–5 players"}).
              </p>
              <a
                href={topic.kaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-accent font-extrabold text-white"
                onClick={() => rpc("openKa", { assignmentId: a.id })}
              >
                Open on Khan Academy
              </a>
              {user.role === "student" ? (
                <a
                  href={`/class/labs?assign=${a.id}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-line font-extrabold"
                >
                  I’m back — start peer lab
                </a>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}
