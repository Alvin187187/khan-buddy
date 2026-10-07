import type { LabType, Mechanic } from "./types";

export type Topic = {
  id: string;
  subject: string;
  title: string;
  kaUrl: string;
  kaLabel: string;
  labType: LabType;
  mechanic: Mechanic;
  partyMin: number;
  partyMax: number;
  liveOk: boolean;
  playPrompt: string;
  conceptTags: string[];
  levels: { id: string; goal: string; conceptTag: string }[];
};

export const TOPICS: Topic[] = [
  {
    id: "bio-cell-cycle",
    subject: "SHS Biology 1",
    title: "The cell cycle",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Cell cycle on Khan Academy",
    labType: "cell_builder",
    mechanic: "build",
    partyMin: 3,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Tap mitosis stages in order.",
    conceptTags: ["organelle", "metaphase", "cell_cycle"],
    levels: [
      { id: "build", goal: "Place nucleus, membrane, and mitochondria.", conceptTag: "organelle" },
      { id: "cycle", goal: "Run G1 → S → G2 → prophase → metaphase → anaphase → telophase.", conceptTag: "metaphase" },
    ],
  },
  {
    id: "bio-cell-parts",
    subject: "SHS Biology 1",
    title: "Cell parts and functions",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Cell parts on Khan Academy",
    labType: "concept_sketch",
    mechanic: "guess",
    partyMin: 2,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Draw it. Guess it.",
    conceptTags: ["organelle", "nucleus", "membrane"],
    levels: [{ id: "draw", goal: "Draw, guess, then name the function.", conceptTag: "organelle" }],
  },
  {
    id: "bio-virus",
    subject: "SHS Biology 1",
    title: "Viruses and the immune system",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Immune system on Khan Academy",
    labType: "virus_defense",
    mechanic: "battle",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Hit the virus. Misses spread it.",
    conceptTags: ["virus", "immune"],
    levels: [{ id: "wave", goal: "Drop virus HP to 0 before spread hits 100%.", conceptTag: "virus" }],
  },
  {
    id: "bio-immune",
    subject: "SHS Biology 1",
    title: "Immune response sequence",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Immune response on Khan Academy",
    labType: "immune_defense",
    mechanic: "solve",
    partyMin: 2,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Antibody → macrophage → T cell → memory.",
    conceptTags: ["immune", "memory_cell"],
    levels: [{ id: "chain", goal: "Stop the pathogen with the correct cell sequence.", conceptTag: "immune" }],
  },
  {
    id: "math-functions",
    subject: "SHS General Math",
    title: "Functions",
    kaUrl: "https://www.khanacademy.org/math/senior-high-school-general-math",
    kaLabel: "Functions on Khan Academy",
    labType: "function_machine",
    mechanic: "solve",
    partyMin: 2,
    partyMax: 2,
    liveOk: false,
    playPrompt: "Pick x. Output f(x).",
    conceptTags: ["function_notation", "linear_function"],
    levels: [
      { id: "plus-two", goal: "f(x) = x + 2", conceptTag: "function_notation" },
      { id: "double", goal: "f(x) = 2x", conceptTag: "linear_function" },
      { id: "slope-intercept", goal: "f(x) = 2x + 1", conceptTag: "linear_function" },
    ],
  },
  {
    id: "earth-solar",
    subject: "SHS Earth Science",
    title: "Universe and the solar system",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    kaLabel: "Earth Science on Khan Academy",
    labType: "concept_sketch",
    mechanic: "guess",
    partyMin: 2,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Draw it. Guess it.",
    conceptTags: ["solar_system", "orbit"],
    levels: [{ id: "draw", goal: "Guess the body, then name the force or path.", conceptTag: "orbit" }],
  },
  {
    id: "earth-systems",
    subject: "SHS Earth Science",
    title: "Earth and earth systems",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    kaLabel: "Earth systems on Khan Academy",
    labType: "ecosystem",
    mechanic: "build",
    partyMin: 3,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Build the food web. Survive a storm.",
    conceptTags: ["earth_system", "ecosystem"],
    levels: [{ id: "balance", goal: "Keep the system alive after a disturbance.", conceptTag: "earth_system" }],
  },
  {
    id: "bio-photo",
    subject: "SHS Biology 1",
    title: "Photosynthesis",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Photosynthesis on Khan Academy",
    labType: "plant_survival",
    mechanic: "simulate",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Balance light, water, CO₂, minerals.",
    conceptTags: ["photosynthesis", "chloroplast"],
    levels: [{ id: "survive", goal: "Keep energy above 0 for three ticks with a balanced mix.", conceptTag: "photosynthesis" }],
  },
];

export function getTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}

export function gameName(id: string) {
  const names: Record<string, string> = {
    "bio-cell-cycle": "Cell Division Rush",
    "bio-cell-parts": "Doodle Detective",
    "bio-virus": "Class vs Virus",
    "bio-immune": "Immune Chain",
    "math-functions": "Function Machine",
    "earth-solar": "Doodle Detective",
    "earth-systems": "Ecosystem Survival",
    "bio-photo": "Plant Survival",
  };
  return names[id] ?? getTopic(id)?.title ?? id;
}

export function reteachUrl(conceptTag: string) {
  if (conceptTag === "function_notation" || conceptTag === "linear_function") {
    return "https://www.khanacademy.org/math/senior-high-school-general-math";
  }
  if (conceptTag === "solar_system" || conceptTag === "earth_system" || conceptTag === "orbit" || conceptTag === "ecosystem") {
    return "https://www.khanacademy.org/science/shs-earth-science";
  }
  return "https://www.khanacademy.org/science/strengthened-shs-biology-1";
}

export const SKETCH_PROMPTS: Record<string, string[]> = {
  "bio-cell-parts": ["nucleus", "mitochondria", "cell membrane", "chloroplast"],
  "earth-solar": ["Earth orbit", "the Sun", "a comet", "the Moon"],
  "bio-cell-cycle": ["metaphase", "anaphase", "a chromosome"],
};

export const VIRUS_QUESTIONS = [
  {
    q: "A virus needs a host cell mainly to…",
    choices: ["make its own ATP", "replicate its genetic material", "photosynthesize", "digest food"],
    answer: 1,
    tag: "virus",
  },
  {
    q: "Antibodies are produced by…",
    choices: ["red blood cells", "B cells", "platelets", "skin cells"],
    answer: 1,
    tag: "immune",
  },
  {
    q: "A vaccine works by…",
    choices: ["killing all bacteria", "training memory cells", "replacing DNA", "raising body temperature forever"],
    answer: 1,
    tag: "immune",
  },
  {
    q: "HIV specifically infects…",
    choices: ["muscle cells", "helper T cells", "neurons only", "skin"],
    answer: 1,
    tag: "virus",
  },
  {
    q: "The first line of defense includes…",
    choices: ["antibodies", "skin and mucus", "memory B cells", "antibiotics you make yourself"],
    answer: 1,
    tag: "immune",
  },
];
