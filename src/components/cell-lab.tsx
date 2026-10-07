"use client";

import { CYCLE_STEPS, cellReady } from "@/lib/labs";
import { rpc } from "@/lib/rpc";
import { Button } from "./ui";

const PARTS = [
  { id: "nucleus", label: "Nucleus", job: "Control center", cx: 110, cy: 86, r: 22, fill: "#1865f2" },
  { id: "membrane", label: "Membrane", job: "Boundary", cx: 130, cy: 90, r: 0, fill: "#0f766e" },
  { id: "mitochondria", label: "Mitochondria", job: "Energy", cx: 168, cy: 104, r: 0, fill: "#e2a100" },
];

export function CellLab({
  roomId,
  sim,
  roleKey,
  canPlay,
  levelIndex,
  live,
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
  live?: boolean;
}) {
  const built = cellReady(sim);
  const op = live ? "liveMove" : "move";
  const idKey = live ? "sessionId" : "roomId";

  function go(type: string, payload: Record<string, unknown> = {}) {
    return rpc(op, { [idKey]: roomId, type, payload });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-black capitalize">{roleKey}</p>
      <svg viewBox="0 0 260 190" className="w-full rounded-[12px] border border-line bg-[#ecf8f4]">
        <ellipse
          cx="130"
          cy="88"
          rx="92"
          ry="72"
          fill={sim.alive ? "#c6f4e8" : "#f4d2d0"}
          stroke="#1a1916"
          strokeWidth="2"
        />
        {sim.placed.membrane ? (
          <ellipse cx="130" cy="88" rx="92" ry="72" fill="none" stroke="#0f766e" strokeWidth="8" />
        ) : null}
        {sim.placed.nucleus ? <circle cx="108" cy="84" r="24" fill="#1865f2" /> : null}
        {sim.placed.mitochondria ? (
          <>
            <ellipse cx="168" cy="102" rx="22" ry="12" fill="#e2a100" />
            <path d="M156 102 Q168 94 180 102 Q168 110 156 102" fill="none" stroke="#1a1916" />
          </>
        ) : null}
        {canPlay && levelIndex === 0 && !sim.placed.nucleus ? (
          <circle
            cx="108"
            cy="84"
            r="24"
            fill="#1865f2"
            opacity="0.25"
            className="cursor-pointer"
            onClick={() => go("place", { part: "nucleus" })}
          />
        ) : null}
        {canPlay && levelIndex === 0 && !sim.placed.mitochondria ? (
          <ellipse
            cx="168"
            cy="102"
            rx="22"
            ry="12"
            fill="#e2a100"
            opacity="0.3"
            className="cursor-pointer"
            onClick={() => go("place", { part: "mitochondria" })}
          />
        ) : null}
        <text x="130" y="178" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a1916">
          {sim.alive ? (built ? "Living cell" : "Tap a ghost organelle to place it") : "Cell failed"}
        </text>
      </svg>
      {canPlay && levelIndex === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {PARTS.map((p) => (
            <Button
              key={p.id}
              variant={sim.placed[p.id] ? "primary" : "secondary"}
              onClick={() => go("place", { part: p.id })}
            >
              {sim.placed[p.id] ? "In place" : "Place"} {p.label} — {p.job}
            </Button>
          ))}
        </div>
      ) : null}
      {canPlay && built && (levelIndex >= 1 || sim.placed.nucleus) ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">Next: {CYCLE_STEPS[sim.cycleIndex] ?? "done"}</p>
          <div className="grid grid-cols-2 gap-2">
            {CYCLE_STEPS.map((step, i) => (
              <Button
                key={step}
                variant={i < sim.cycleIndex ? "primary" : "secondary"}
                disabled={!sim.alive}
                onClick={() => go("cycle", { step })}
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
            {sim.skippedMetaphase ? "Metaphase was skipped." : "Wrong order."} Heart lost.
          </p>
          {canPlay ? (
            <Button variant="secondary" onClick={() => go("revive")}>
              Retry cycle
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
