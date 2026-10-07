import type { LabType } from "./types";

export const MAX_HEARTS = 3;

export const CELL_ROLES = [
  "nucleus",
  "membrane",
  "mitochondria",
  "checkpoint",
  "timer",
] as const;

export const CYCLE_STEPS = [
  "G1",
  "S",
  "G2",
  "prophase",
  "metaphase",
  "anaphase",
  "telophase",
] as const;

export type FunctionSim = {
  kind: "function_machine";
  x: number;
  yGuess: number | null;
  locked: boolean;
  lastCorrect: boolean | null;
};

export type CellSim = {
  kind: "cell_builder";
  placed: Record<string, boolean>;
  cycleIndex: number;
  alive: boolean;
  skippedMetaphase: boolean;
};

export function emptySim(lab: LabType): FunctionSim | CellSim {
  if (lab === "function_machine") {
    return {
      kind: "function_machine",
      x: 1,
      yGuess: null,
      locked: false,
      lastCorrect: null,
    };
  }
  return {
    kind: "cell_builder",
    placed: {
      nucleus: false,
      membrane: false,
      mitochondria: false,
    },
    cycleIndex: 0,
    alive: true,
    skippedMetaphase: false,
  };
}

export function fnRule(levelIndex: number) {
  if (levelIndex === 0) return { label: "f(x) = x + 2", f: (x: number) => x + 2 };
  if (levelIndex === 1) return { label: "f(x) = 2x", f: (x: number) => 2 * x };
  return { label: "f(x) = 2x + 1", f: (x: number) => 2 * x + 1 };
}

export function applyMove(
  lab: LabType,
  sim: Record<string, unknown>,
  move: { type: string; payload?: Record<string, unknown> },
): { sim: Record<string, unknown>; failTag?: string; success?: boolean } {
  if (lab === "function_machine") {
    const s = sim as unknown as FunctionSim;
    if (move.type === "setX") {
      return { sim: { ...s, x: Number(move.payload?.x ?? 0), yGuess: null, lastCorrect: null } };
    }
    if (move.type === "setY") {
      return { sim: { ...s, yGuess: Number(move.payload?.y ?? 0) } };
    }
    if (move.type === "check") {
      const level = Number(move.payload?.levelIndex ?? 0);
      const rule = fnRule(level);
      const ok = s.yGuess !== null && s.yGuess === rule.f(s.x);
      return {
        sim: { ...s, lastCorrect: ok, locked: ok },
        success: ok,
        failTag: ok ? undefined : "function_notation",
      };
    }
  }

  const s = sim as unknown as CellSim;
  if (move.type === "place") {
    const part = String(move.payload?.part ?? "");
    const wasReady = Boolean(s.placed.nucleus && s.placed.membrane && s.placed.mitochondria);
    const placed = { ...s.placed, [part]: true };
    const ready = Boolean(placed.nucleus && placed.membrane && placed.mitochondria);
    return { sim: { ...s, placed, alive: true }, success: ready && !wasReady };
  }
  if (move.type === "cycle") {
    const step = String(move.payload?.step ?? "");
    const expected = CYCLE_STEPS[s.cycleIndex];
    if (step !== expected) {
      const skippedMeta = expected === "metaphase" || step !== "metaphase";
      return {
        sim: {
          ...s,
          alive: false,
          skippedMetaphase: expected === "metaphase",
        },
        failTag: expected === "metaphase" ? "metaphase" : "cell_cycle",
      };
    }
    const next = s.cycleIndex + 1;
    const done = next >= CYCLE_STEPS.length;
    return {
      sim: { ...s, cycleIndex: next, alive: true },
      success: done,
    };
  }
  if (move.type === "revive") {
    return {
      sim: { ...s, alive: true, skippedMetaphase: false, cycleIndex: 0 },
    };
  }
  return { sim };
}

export function cellReady(sim: Record<string, unknown>) {
  const s = sim as unknown as CellSim;
  return s.placed.nucleus && s.placed.membrane && s.placed.mitochondria;
}

export function roleForIndex(lab: LabType, index: number) {
  if (lab === "function_machine") {
    return index === 0 ? "rule" : "graph";
  }
  return CELL_ROLES[index % CELL_ROLES.length];
}
