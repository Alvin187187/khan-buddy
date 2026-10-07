"use client";

import { useRef, useState } from "react";
import { VIRUS_QUESTIONS as Qs } from "@/lib/topics";
import { rpc } from "@/lib/rpc";
import { Button, Card, Input } from "./ui";
import { CellLab } from "./cell-lab";
import { FunctionLab } from "./function-lab";

function useGo(roomId: string, live?: boolean) {
  const op = live ? "liveMove" : "move";
  const idKey = live ? "sessionId" : "roomId";
  return (type: string, payload: Record<string, unknown> = {}) => rpc(op, { [idKey]: roomId, type, payload });
}

export function VirusLab({
  roomId,
  sim,
  canPlay,
  live,
}: {
  roomId: string;
  sim: { hp: number; spread: number; q: number; last: boolean | null; log: string };
  canPlay: boolean;
  live?: boolean;
}) {
  const go = useGo(roomId, live);
  const q = Qs[sim.q % Qs.length];
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[12px] border border-line bg-[#1a1916] p-4 text-[#f6f1e8]">
        <p className="text-xl font-black">Class vs Virus</p>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold">Virus HP {sim.hp}%</p>
          <div className="h-3 overflow-hidden rounded bg-white/15">
            <div className="h-full bg-[#e11d48]" style={{ width: `${sim.hp}%` }} />
          </div>
          <p className="text-xs font-bold">Spread {sim.spread}%</p>
          <div className="h-3 overflow-hidden rounded bg-white/15">
            <div className="h-full bg-[#e2a100]" style={{ width: `${sim.spread}%` }} />
          </div>
        </div>
        <p className="mt-3 text-sm">{sim.log}</p>
      </div>
      {canPlay ? (
        <Card className="flex flex-col gap-2">
          <p className="font-black">{q.q}</p>
          {q.choices.map((c, i) => (
            <Button key={c} variant="secondary" className="justify-start" onClick={() => go("answer", { choice: i })}>
              {c}
            </Button>
          ))}
        </Card>
      ) : (
        <p className="text-sm text-muted">Board view</p>
      )}
      {sim.last === true ? <p className="font-bold text-primary">Hit.</p> : null}
      {sim.last === false ? <p className="font-bold text-danger">Miss — it spread.</p> : null}
    </div>
  );
}

export function PlantLab({
  roomId,
  sim,
  canPlay,
  live,
}: {
  roomId: string;
  sim: { light: number; water: number; co2: number; minerals: number; energy: number; ticks: number; wilted: boolean };
  canPlay: boolean;
  live?: boolean;
}) {
  const go = useGo(roomId, live);
  const knobs = [
    { key: "light", label: "Light", emoji: "☀️" },
    { key: "water", label: "Water", emoji: "💧" },
    { key: "co2", label: "CO₂", emoji: "🫧" },
    { key: "minerals", label: "Minerals", emoji: "🌱" },
  ] as const;
  const hue = sim.wilted ? "#b42318" : sim.energy > 55 ? "#0f766e" : "#e2a100";
  return (
    <div className="flex flex-col gap-3">
      <p className="font-black">Day {sim.ticks}/3 · aim ~55</p>
      <svg viewBox="0 0 260 160" className="w-full rounded-[12px] border border-line bg-[#eef6ea]">
        <ellipse cx="130" cy="140" rx="80" ry="12" fill="#c6f4e8" />
        <rect x="124" y="70" width="12" height="70" fill="#0f766e" />
        <ellipse cx="130" cy="58" rx={28 + sim.energy / 8} ry={22 + sim.energy / 10} fill={hue} />
        <text x="130" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1a1916">
          Energy {Math.round(sim.energy)}
        </text>
      </svg>
      {knobs.map((k) => (
        <label key={k.key} className="flex flex-col gap-1 text-sm font-bold">
          {k.emoji} {k.label} {sim[k.key]}
          <input
            type="range"
            min={0}
            max={100}
            value={sim[k.key]}
            disabled={!canPlay}
            onChange={(e) => go("set", { key: k.key, val: Number(e.target.value) })}
          />
        </label>
      ))}
      {canPlay ? (
        <Button disabled={sim.wilted} onClick={() => go("tick")}>
          Next day
        </Button>
      ) : null}
      {sim.wilted ? <p className="font-bold text-danger">Wilted</p> : null}
    </div>
  );
}

export function EcoLab({
  roomId,
  sim,
  canPlay,
  live,
}: {
  roomId: string;
  sim: { producers: number; consumers: number; decomposers: number; disturbance: boolean; survived: boolean | null };
  canPlay: boolean;
  live?: boolean;
}) {
  const go = useGo(roomId, live);
  const tiles = [
    { part: "producers", label: "Producers", n: sim.producers, hint: "Plants / phytoplankton" },
    { part: "consumers", label: "Consumers", n: sim.consumers, hint: "Animals that eat" },
    { part: "decomposers", label: "Decomposers", n: sim.decomposers, hint: "Fungi / bacteria" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="font-black">2 producers · 1 consumer · 1 decomposer</p>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <button
            key={t.part}
            disabled={!canPlay}
            onClick={() => go("add", { part: t.part })}
            className="rounded-[12px] border border-line bg-surface p-3 text-left"
          >
            <p className="text-2xl font-black">{t.n}</p>
            <p className="text-sm font-extrabold">{t.label}</p>
            <p className="text-xs text-muted">{t.hint}</p>
          </button>
        ))}
      </div>
      {canPlay ? (
        <Button variant="secondary" onClick={() => go("disturb")}>
          Storm
        </Button>
      ) : null}
      {sim.survived === true ? <p className="font-bold text-primary">The system held.</p> : null}
      {sim.survived === false ? (
        <p className="font-bold text-danger">It collapsed. Missing a role in the cycle.</p>
      ) : null}
    </div>
  );
}

export function ImmuneLab({
  roomId,
  sim,
  canPlay,
  live,
}: {
  roomId: string;
  sim: { pathogen: number; picked: string[]; wave: number };
  canPlay: boolean;
  live?: boolean;
}) {
  const go = useGo(roomId, live);
  const labels: Record<string, string> = {
    antibody: "Antibody",
    macrophage: "Macrophage",
    tcell: "T cell",
    memory: "Memory cell",
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[12px] border border-line bg-surface p-4">
        <p className="text-sm text-muted">Pathogen load</p>
        <div className="mt-2 h-3 overflow-hidden rounded bg-line">
          <div className="h-full bg-danger" style={{ width: `${sim.pathogen}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold">
          Sequence: {sim.picked.map((p) => labels[p]).join(" → ") || "none yet"}
        </p>
      </div>
      {canPlay ? (
        <div className="grid grid-cols-2 gap-2">
          {(["antibody", "macrophage", "tcell", "memory"] as const).map((cell) => (
            <Button key={cell} variant="secondary" onClick={() => go("pick", { cell })}>
              {labels[cell]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SketchLab({
  roomId,
  sim,
  canPlay,
  roleKey,
  live,
}: {
  roomId: string;
  sim: {
    prompt: string;
    strokes: number[][][];
    guesses: { name: string; text: string; ok: boolean }[];
    revealed: boolean;
  };
  canPlay: boolean;
  roleKey: string;
  live?: boolean;
}) {
  const go = useGo(roomId, live);
  const drawer = roleKey === "drawer";
  const svgRef = useRef<SVGSVGElement>(null);
  const current = useRef<number[][]>([]);
  const [guess, setGuess] = useState("");

  function pos(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 260, ((e.clientY - r.top) / r.height) * 180];
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-xl font-black">{drawer || sim.revealed ? sim.prompt : "???"}</p>
      </Card>
      <svg
        ref={svgRef}
        viewBox="0 0 260 180"
        className="w-full touch-none rounded-[12px] border border-line bg-white"
        onPointerDown={(e) => {
          if (!canPlay || !drawer) return;
          current.current = [pos(e)];
        }}
        onPointerMove={(e) => {
          if (!canPlay || !drawer || !current.current.length) return;
          current.current.push(pos(e));
        }}
        onPointerUp={() => {
          if (!canPlay || !drawer || current.current.length < 2) {
            current.current = [];
            return;
          }
          go("stroke", { pts: current.current });
          current.current = [];
        }}
      >
        {sim.strokes.map((stroke, i) => (
          <polyline
            key={i}
            fill="none"
            stroke="#1a1916"
            strokeWidth="3"
            strokeLinecap="round"
            points={stroke.map((p) => p.join(",")).join(" ")}
          />
        ))}
      </svg>
      {canPlay && drawer ? (
        <Button variant="secondary" onClick={() => go("clear")}>
          Clear board
        </Button>
      ) : null}
      {canPlay && !drawer && !sim.revealed ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            go("guess", { text: guess });
            setGuess("");
          }}
        >
          <Input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Your guess" />
          <Button type="submit">Guess</Button>
        </form>
      ) : null}
      <ul className="text-sm">
        {sim.guesses.map((g, i) => (
          <li key={i} className={g.ok ? "font-bold text-primary" : "text-muted"}>
            {g.name}: {g.text}
            {g.ok ? " — got it" : ""}
          </li>
        ))}
      </ul>
      {sim.revealed ? <p className="font-black">Job of {sim.prompt}?</p> : null}
    </div>
  );
}

export function GameBoard(props: {
  labType: string;
  roomId: string;
  sim: any;
  roleKey: string;
  canPlay: boolean;
  levelIndex?: number;
  live?: boolean;
}) {
  const { labType, ...rest } = props;
  const levelIndex = rest.levelIndex ?? 0;
  if (labType === "function_machine") return <FunctionLab {...rest} levelIndex={levelIndex} />;
  if (labType === "cell_builder") return <CellLab {...rest} levelIndex={levelIndex} />;
  if (labType === "virus_defense") return <VirusLab {...rest} />;
  if (labType === "plant_survival") return <PlantLab {...rest} />;
  if (labType === "ecosystem") return <EcoLab {...rest} />;
  if (labType === "immune_defense") return <ImmuneLab {...rest} />;
  if (labType === "concept_sketch") return <SketchLab {...rest} />;
  return <p className="text-muted">Unknown lab.</p>;
}
