import { SKETCH_PROMPTS, VIRUS_QUESTIONS } from "./topics";
import type { LabType } from "./types";

export const MAX_HEARTS = 3;

export const CELL_ROLES = ["nucleus", "membrane", "mitochondria", "checkpoint", "timer"] as const;

export const CYCLE_STEPS = ["G1", "S", "G2", "prophase", "metaphase", "anaphase", "telophase"] as const;

export const IMMUNE_CHAIN = ["antibody", "macrophage", "tcell", "memory"] as const;

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

export type SketchSim = {
  kind: "concept_sketch";
  prompt: string;
  strokes: number[][][];
  guesses: { name: string; text: string; ok: boolean }[];
  drawerIndex: number;
  revealed: boolean;
};

export type VirusSim = {
  kind: "virus_defense";
  hp: number;
  spread: number;
  q: number;
  last: boolean | null;
  log: string;
};

export type EcoSim = {
  kind: "ecosystem";
  producers: number;
  consumers: number;
  decomposers: number;
  disturbance: boolean;
  survived: boolean | null;
};

export type PlantSim = {
  kind: "plant_survival";
  light: number;
  water: number;
  co2: number;
  minerals: number;
  energy: number;
  ticks: number;
  wilted: boolean;
};

export type ImmuneSim = {
  kind: "immune_defense";
  pathogen: number;
  picked: string[];
  wave: number;
};

export type AnySim = FunctionSim | CellSim | SketchSim | VirusSim | EcoSim | PlantSim | ImmuneSim;

export function emptySim(lab: LabType, topicId = ""): AnySim {
  if (lab === "function_machine") {
    return { kind: "function_machine", x: 1, yGuess: null, locked: false, lastCorrect: null };
  }
  if (lab === "concept_sketch") {
    const bank = SKETCH_PROMPTS[topicId] ?? SKETCH_PROMPTS["bio-cell-parts"];
    return {
      kind: "concept_sketch",
      prompt: bank[0] ?? "nucleus",
      strokes: [],
      guesses: [],
      drawerIndex: 0,
      revealed: false,
    };
  }
  if (lab === "virus_defense") {
    return { kind: "virus_defense", hp: 100, spread: 8, q: 0, last: null, log: "A pathogen entered the class." };
  }
  if (lab === "ecosystem") {
    return { kind: "ecosystem", producers: 0, consumers: 0, decomposers: 0, disturbance: false, survived: null };
  }
  if (lab === "plant_survival") {
    return { kind: "plant_survival", light: 40, water: 40, co2: 40, minerals: 40, energy: 72, ticks: 0, wilted: false };
  }
  if (lab === "immune_defense") {
    return { kind: "immune_defense", pathogen: 80, picked: [], wave: 1 };
  }
  return {
    kind: "cell_builder",
    placed: { nucleus: false, membrane: false, mitochondria: false },
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

  if (lab === "cell_builder") {
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
        return {
          sim: { ...s, alive: false, skippedMetaphase: expected === "metaphase" },
          failTag: expected === "metaphase" ? "metaphase" : "cell_cycle",
        };
      }
      const next = s.cycleIndex + 1;
      return { sim: { ...s, cycleIndex: next, alive: true }, success: next >= CYCLE_STEPS.length };
    }
    if (move.type === "revive") {
      return { sim: { ...s, alive: true, skippedMetaphase: false, cycleIndex: 0 } };
    }
  }

  if (lab === "concept_sketch") {
    const s = sim as unknown as SketchSim;
    if (move.type === "stroke") {
      const pts = (move.payload?.pts as number[][]) ?? [];
      return { sim: { ...s, strokes: [...s.strokes, pts].slice(-40) } };
    }
    if (move.type === "guess") {
      const text = String(move.payload?.text ?? "").trim().toLowerCase();
      const name = String(move.payload?.name ?? "Student");
      const ok =
        text.length > 1 &&
        (s.prompt.toLowerCase().includes(text) || text.includes(s.prompt.toLowerCase()));
      const guesses = [...s.guesses, { name, text, ok }].slice(-12);
      return { sim: { ...s, guesses, revealed: ok || s.revealed }, success: ok };
    }
    if (move.type === "reveal") {
      return { sim: { ...s, revealed: true }, success: true };
    }
    if (move.type === "clear") {
      return { sim: { ...s, strokes: [] } };
    }
  }

  if (lab === "virus_defense") {
    const s = sim as unknown as VirusSim;
    if (move.type === "answer") {
      const q = VIRUS_QUESTIONS[s.q % VIRUS_QUESTIONS.length];
      const choice = Number(move.payload?.choice);
      const name = String(move.payload?.name ?? "A student");
      const ok = choice === q.answer;
      const hp = Math.max(0, s.hp - (ok ? 18 : 0));
      const spread = Math.min(100, s.spread + (ok ? 0 : 16));
      const won = hp <= 0;
      const lost = spread >= 100;
      return {
        sim: {
          ...s,
          hp,
          spread,
          q: s.q + 1,
          last: ok,
          log: ok ? `${name} hit the virus.` : `${name} missed — it spread.`,
        },
        success: won,
        failTag: lost ? "virus" : undefined,
      };
    }
  }

  if (lab === "ecosystem") {
    const s = sim as unknown as EcoSim;
    if (move.type === "add") {
      const part = String(move.payload?.part ?? "");
      const next = {
        ...s,
        producers: s.producers + (part === "producers" ? 1 : 0),
        consumers: s.consumers + (part === "consumers" ? 1 : 0),
        decomposers: s.decomposers + (part === "decomposers" ? 1 : 0),
      };
      return { sim: next };
    }
    if (move.type === "disturb") {
      const ok = s.producers >= 2 && s.consumers >= 1 && s.decomposers >= 1;
      return {
        sim: { ...s, disturbance: true, survived: ok },
        success: ok,
        failTag: ok ? undefined : "earth_system",
      };
    }
  }

  if (lab === "plant_survival") {
    const s = sim as unknown as PlantSim;
    if (move.type === "set") {
      const key = String(move.payload?.key ?? "light") as keyof PlantSim;
      const val = Math.max(0, Math.min(100, Number(move.payload?.val ?? 0)));
      return { sim: { ...s, [key]: val } };
    }
    if (move.type === "tick") {
      const balance = (n: number) => 1 - Math.abs(n - 55) / 70;
      const gain = (balance(s.light) + balance(s.water) + balance(s.co2) + balance(s.minerals)) / 4;
      const energy = Math.max(0, Math.min(100, s.energy + (gain - 0.42) * 40));
      const ticks = s.ticks + 1;
      const wilted = energy <= 0;
      const won = ticks >= 3 && energy >= 50;
      return {
        sim: { ...s, energy, ticks, wilted },
        success: won,
        failTag: wilted ? "photosynthesis" : undefined,
      };
    }
  }

  if (lab === "immune_defense") {
    const s = sim as unknown as ImmuneSim;
    if (move.type === "pick") {
      const cell = String(move.payload?.cell ?? "");
      const expected = IMMUNE_CHAIN[s.picked.length];
      if (cell !== expected) {
        return {
          sim: { ...s, pathogen: Math.min(100, s.pathogen + 12), picked: [] },
          failTag: "immune",
        };
      }
      const picked = [...s.picked, cell];
      const done = picked.length >= IMMUNE_CHAIN.length;
      return {
        sim: { ...s, picked, pathogen: done ? 0 : s.pathogen - 18 },
        success: done,
      };
    }
  }

  return { sim };
}

export function cellReady(sim: Record<string, unknown>) {
  const s = sim as unknown as CellSim;
  return Boolean(s.placed?.nucleus && s.placed?.membrane && s.placed?.mitochondria);
}

export function roleForIndex(lab: LabType, index: number) {
  if (lab === "function_machine") return index === 0 ? "rule" : "graph";
  if (lab === "concept_sketch") return index === 0 ? "drawer" : "guesser";
  if (lab === "ecosystem") return ["producer", "consumer", "decomposer", "observer", "disturbance"][index % 5];
  if (lab === "cell_builder") return CELL_ROLES[index % CELL_ROLES.length];
  return "player";
}
