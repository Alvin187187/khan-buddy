"use client";

import { CYCLE_STEPS, cellReady } from "@/lib/labs";
import { rpc } from "@/lib/rpc";
import { Button, Card } from "./ui";

const PARTS = [
  { id: "nucleus", label: "Nucleus", job: "Control center" },
  { id: "membrane", label: "Membrane", job: "Boundary" },
  { id: "mitochondria", label: "Mitochondria", job: "Energy" },
];

export function CellLab({
  roomId,
  sim,
  roleKey,
  canPlay,
  levelIndex,
}: {
  roomId: string;
  sim: {
    placed: Record<string, boolean>;
    cycleIndex: number;
    alive: boolean;
    skippedMetaphase: boolean;
  };
  roleKey: string;
  canPlay: boolean;
  levelIndex: number;
}) {
  const built = cellReady(sim);
  const mine =
    roleKey === "nucleus" || roleKey === "membrane" || roleKey === "mitochondria"
      ? roleKey
      : "checkpoint";

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-sm text-muted">Your role</p>
        <p className="text-xl font-black capitalize">{roleKey}</p>
        <p className="text-sm text-muted">
          {levelIndex === 0
            ? "Each buddy places a part. The cell only lives if all three core parts are in."
            : "Tap the cell-cycle stages in order. Skipping metaphase kills the cell."}
        </p>
      </Card>
      <svg viewBox="0 0 260 180" className="w-full rounded-[12px] border border-line bg-surface">
        <ellipse
          cx="130"
          cy="90"
          rx="90"
          ry="70"
          fill={sim.alive ? "#c6f4e8" : "#f4d2d0"}
          stroke="#1a1916"
        />
        {sim.placed.membrane ? (
          <ellipse cx="130" cy="90" rx="90" ry="70" fill="none" stroke="#0f766e" strokeWidth="6" />
        ) : null}
        {sim.placed.nucleus ? (
          <circle cx="110" cy="85" r="22" fill="#1865f2" />
        ) : null}
        {sim.placed.mitochondria ? (
          <ellipse cx="165" cy="100" rx="18" ry="10" fill="#e2a100" />
        ) : null}
        <text x="130" y="170" textAnchor="middle" fontSize="12">
          {sim.alive ? (built ? "Living cell" : "Incomplete") : "Cell failed"}
        </text>
      </svg>
      {canPlay && levelIndex === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {PARTS.map((p) => (
            <Button
              key={p.id}
              variant={sim.placed[p.id] ? "primary" : "secondary"}
              disabled={mine !== p.id && mine !== "checkpoint"}
              onClick={() => rpc("move", { roomId, type: "place", payload: { part: p.id } })}
            >
              Place {p.label} — {p.job}
            </Button>
          ))}
        </div>
      ) : null}
      {canPlay && built && (levelIndex >= 1 || sim.placed.nucleus) ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">Next expected: {CYCLE_STEPS[sim.cycleIndex] ?? "done"}</p>
          <div className="grid grid-cols-2 gap-2">
            {CYCLE_STEPS.map((step) => (
              <Button
                key={step}
                variant="secondary"
                disabled={!sim.alive}
                onClick={() => rpc("move", { roomId, type: "cycle", payload: { step } })}
              >
                {step}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {!sim.alive ? (
        <div className="flex flex-col gap-2">
          <p className="font-bold text-danger">
            {sim.skippedMetaphase
              ? "Metaphase was skipped. Heart lost."
              : "Wrong order. Heart lost."}
          </p>
          {canPlay ? (
            <Button variant="secondary" onClick={() => rpc("move", { roomId, type: "revive" })}>
              Retry cycle
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
