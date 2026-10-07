"use client";

import { Card } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";

export default function PeoplePage() {
  const { data, error } = useSnapshot();
  if (!data && !error) return <p className="text-muted">Loading people…</p>;
  if (!data?.classroom) return <p className="text-muted">Join or create a class first.</p>;
  if (data.user.role !== "teacher") {
    return <p className="text-muted">Only the teacher sees the roster.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-black">People</h1>
      <p className="text-sm text-muted">{data.people.length} signed-in students</p>
      {data.people.length === 0 ? (
        <p className="text-sm text-muted">Share the class QR. Students must sign in to appear here.</p>
      ) : (
        data.people.map((p: { id: string; name: string; email: string; xp: number }) => (
          <Card key={p.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-extrabold">{p.name}</p>
              <p className="text-xs text-muted">{p.email}</p>
            </div>
            <p className="text-sm font-bold text-primary">{p.xp} XP</p>
          </Card>
        ))
      )}
    </div>
  );
}
