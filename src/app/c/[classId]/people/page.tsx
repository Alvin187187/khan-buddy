"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";

export default function PeoplePage() {
  const { classId } = useParams<{ classId: string }>();
  const { data, error } = useSnapshot(classId);
  if (!data && !error) return <p className="text-muted">Loading…</p>;
  if (error) return <p className="font-bold text-danger">{error}</p>;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-black">People</h1>
      <p className="text-sm font-bold text-muted">Code {data.classroom.code}. They scan in.</p>
      {data.people.map((p: { id: string; name: string; xp: number }) => (
        <Card key={p.id} className="flex items-center justify-between">
          <p className="font-extrabold">{p.name}</p>
          <p className="text-sm font-bold text-primary">{p.xp}</p>
        </Card>
      ))}
      {data.people.length === 0 ? <p className="text-muted">No one yet. Share the code.</p> : null}
    </div>
  );
}
