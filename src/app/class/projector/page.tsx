"use client";

import { Card } from "@/components/ui";
import { useSnapshot } from "@/hooks/use-snapshot";

export default function ProjectorPage() {
  const { data } = useSnapshot();
  if (!data?.classroom) return <p className="p-6">No class.</p>;
  const rooms = data.rooms.filter((r: { status: string }) => r.status !== "complete");
  return (
    <div className="min-h-dvh bg-background p-6">
      <h1 className="text-3xl font-black">Tables in progress</h1>
      <p className="text-muted">Not a ranking. No public fail list.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rooms.map(
          (r: {
            id: string;
            status: string;
            stuckConcept: string | null;
            players: { name: string }[];
          }) => (
            <Card key={r.id}>
              <p className="text-xl font-black">Table {r.id.slice(-4)}</p>
              <p>{r.players.map((p) => p.name).join(", ")}</p>
              <p className="text-sm text-muted">
                {r.status}
                {r.stuckConcept ? " · needs help" : ""}
              </p>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
