"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button, Card } from "@/components/ui";
import { QrCard } from "@/components/qr-card";
import { useSnapshot } from "@/hooks/use-snapshot";
import { rpc } from "@/lib/rpc";
import { getTopic } from "@/lib/topics";
import { useRouter } from "next/navigation";

function LabsInner() {
  const { data, reload } = useSnapshot();
  const params = useSearchParams();
  const router = useRouter();
  const assignPref = params.get("assign");
  if (!data?.classroom) return <p className="text-muted">Join a class first.</p>;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assignments = data.assignments as { id: string; topicId: string; labType: string }[];
  const rooms = [...data.rooms].reverse();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">{data.user.role === "teacher" ? "Tables" : "Peer labs"}</h1>
      <p className="text-sm text-muted">
        Pairs need 2. Squad labs need 3–5. The lab will not start until the table is full enough.
      </p>

      {data.user.role === "student"
        ? assignments.map((a) => {
            const topic = getTopic(a.topicId);
            if (!topic) return null;
            const highlight = assignPref === a.id;
            return (
              <Card key={a.id} className={highlight ? "border-primary" : ""}>
                <p className="text-xs font-bold text-primary">{topic.subject}</p>
                <p className="font-extrabold">{topic.title}</p>
                <p className="text-sm text-muted">
                  {topic.partyMin}–{topic.partyMax} players · {topic.labType.replace("_", " ")}
                </p>
                <Button
                  className="mt-3 w-full"
                  onClick={async () => {
                    const room = await rpc<{ id: string }>("createRoom", {
                      assignmentId: a.id,
                      labType: topic.labType,
                    });
                    router.push(`/lab/${room.id}`);
                  }}
                >
                  Open a table
                </Button>
              </Card>
            );
          })
        : null}

      {rooms.map(
        (r: {
          id: string;
          labType: string;
          status: string;
          hearts: number;
          stuckConcept: string | null;
          assignmentId: string;
          players: { name: string; userId: string }[];
        }) => {
          const topic = getTopic(
            assignments.find((a) => a.id === r.assignmentId)?.topicId ?? "",
          );
          const min = topic?.partyMin ?? 2;
          const max = topic?.partyMax ?? 5;
          return (
            <Card key={r.id} className="flex flex-col gap-2">
              <p className="font-extrabold">{topic?.title ?? r.labType}</p>
              <p className="text-sm text-muted">
                {r.players.length}/{max} seated (need {min} to start) · {r.status}
              </p>
              <p className="text-sm">{r.players.map((p) => p.name).join(", ") || "Waiting"}</p>
              {data.user.role === "student" ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await rpc("joinRoom", { roomId: r.id });
                    router.push(`/lab/${r.id}`);
                  }}
                >
                  Sit at this table
                </Button>
              ) : (
                <a href={`/lab/${r.id}`} className="font-extrabold text-primary">
                  Observe table
                </a>
              )}
              {data.user.role === "teacher" ? (
                <QrCard url={`${origin}/lab/${r.id}`} label="Scan to join this table" />
              ) : null}
            </Card>
          );
        },
      )}

      {rooms.length === 0 ? (
        <p className="text-sm text-muted">No tables yet. A student opens one after the KA lesson.</p>
      ) : null}

      <button className="text-sm font-bold text-muted" onClick={() => reload()}>
        Refresh
      </button>
    </div>
  );
}

export default function LabsPage() {
  return (
    <Suspense>
      <LabsInner />
    </Suspense>
  );
}
