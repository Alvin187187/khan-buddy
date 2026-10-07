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
}: {
  roomId: string;
  sim: { x: number; yGuess: number | null; lastCorrect: boolean | null };
  levelIndex: number;
  roleKey: string;
  canPlay: boolean;
}) {
  const rule = fnRule(levelIndex);
  const xs = [-2, -1, 0, 1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-sm text-muted">Shared machine</p>
        <p className="text-2xl font-black">{rule.label}</p>
        <p className="text-sm">
          Role: {roleKey === "rule" ? "You pick x" : "You output f(x)"}
        </p>
      </Card>
      <svg viewBox="0 0 220 140" className="w-full rounded-[12px] border border-line bg-surface">
        <line x1="20" y1="70" x2="200" y2="70" stroke="#1a1916" />
        <line x1="110" y1="10" x2="110" y2="130" stroke="#1a1916" />
        {xs.map((x) => {
          const y = rule.f(x);
          return (
            <circle
              key={x}
              cx={110 + x * 18}
              cy={70 - y * 8}
              r={x === sim.x ? 6 : 3}
              fill={x === sim.x ? "#0f766e" : "#c6f4e8"}
            />
          );
        })}
        {sim.yGuess !== null ? (
          <circle
            cx={110 + sim.x * 18}
            cy={70 - sim.yGuess * 8}
            r={5}
            fill="#1865f2"
          />
        ) : null}
      </svg>
      {canPlay && roleKey === "rule" ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => rpc("move", { roomId, type: "setX", payload: { x: sim.x - 1 } })}
          >
            x − 1
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => rpc("move", { roomId, type: "setX", payload: { x: sim.x + 1 } })}
          >
            x + 1
          </Button>
        </div>
      ) : null}
      {canPlay && roleKey === "graph" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">Your output for x = {sim.x}</p>
          <div className="grid grid-cols-4 gap-2">
            {[-2, 0, 1, 2, 3, 4, 5, 7, 9].map((y) => (
              <Button
                key={y}
                variant={sim.yGuess === y ? "primary" : "secondary"}
                onClick={() => rpc("move", { roomId, type: "setY", payload: { y } })}
              >
                {y}
              </Button>
            ))}
          </div>
          <Button onClick={() => rpc("move", { roomId, type: "check" })}>Check together</Button>
        </div>
      ) : null}
      {sim.lastCorrect === false ? (
        <p className="font-bold text-danger">Not yet — talk it through. Heart lost.</p>
      ) : null}
      {sim.lastCorrect === true ? (
        <p className="font-bold text-primary">The graph matches. Level up.</p>
      ) : null}
    </div>
  );
}
