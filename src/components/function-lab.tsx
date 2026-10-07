"use client";

import { Button, Card } from "./ui";
import { fnRule } from "@/lib/labs";
import { rpc } from "@/lib/rpc";

export function FunctionLab({
  roomId,
  sim,
  levelIndex,
  roleKey,
  canPlay,
  live,
}: {
  roomId: string;
  sim: { x: number; yGuess: number | null; lastCorrect: boolean | null };
  levelIndex: number;
  roleKey: string;
  canPlay: boolean;
  live?: boolean;
}) {
  const rule = fnRule(levelIndex);
  const xs = [-2, -1, 0, 1, 2, 3, 4];
  const op = live ? "liveMove" : "move";
  const idKey = live ? "sessionId" : "roomId";
  const go = (type: string, payload: Record<string, unknown> = {}) =>
    rpc(op, { [idKey]: roomId, type, payload });

  return (
    <div className="flex flex-col gap-3">
      <Card className="bg-[#0f766e] text-primary-ink">
        <p className="text-sm opacity-80">Shared machine</p>
        <p className="text-3xl font-black">{rule.label}</p>
        <p className="text-sm">
          {roleKey === "rule" ? "You pick x. Wait for your buddy’s output." : "You output f(x). Watch the graph."}
        </p>
      </Card>
      <div className="relative overflow-hidden rounded-[12px] border border-line bg-surface">
        <div className="absolute left-4 top-4 rounded-[8px] bg-highlight px-2 py-1 text-sm font-black">
          x = {sim.x}
        </div>
        <svg viewBox="0 0 220 150" className="w-full">
          <line x1="20" y1="75" x2="200" y2="75" stroke="#1a1916" />
          <line x1="110" y1="12" x2="110" y2="138" stroke="#1a1916" />
          {xs.map((x) => {
            const y = rule.f(x);
            return (
              <circle
                key={x}
                cx={110 + x * 18}
                cy={75 - y * 8}
                r={x === sim.x ? 7 : 3}
                fill={x === sim.x ? "#0f766e" : "#c6f4e8"}
              />
            );
          })}
          {sim.yGuess !== null ? (
            <circle cx={110 + sim.x * 18} cy={75 - sim.yGuess * 8} r={6} fill="#1865f2" />
          ) : null}
        </svg>
      </div>
      {canPlay && roleKey === "rule" ? (
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => go("setX", { x: sim.x - 1 })}>
            x − 1
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => go("setX", { x: sim.x + 1 })}>
            x + 1
          </Button>
        </div>
      ) : null}
      {canPlay && roleKey === "graph" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">Output for x = {sim.x}</p>
          <div className="grid grid-cols-4 gap-2">
            {[-2, 0, 1, 2, 3, 4, 5, 7, 9].map((y) => (
              <Button
                key={y}
                variant={sim.yGuess === y ? "primary" : "secondary"}
                onClick={() => go("setY", { y })}
              >
                {y}
              </Button>
            ))}
          </div>
          <Button onClick={() => go("check")}>Check together</Button>
        </div>
      ) : null}
      {sim.lastCorrect === false ? (
        <p className="font-bold text-danger">Not yet — talk it through.</p>
      ) : null}
      {sim.lastCorrect === true ? (
        <p className="font-bold text-primary">The graph matches.</p>
      ) : null}
    </div>
  );
}
