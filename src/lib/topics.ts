import type { LabType, Mechanic } from "./types";

export type LessonGame = {
  name: string;
  labType: LabType;
  line: string;
};

export type Topic = {
  id: string;
  subject: string;
  subjectId: "earth" | "biology" | "math";
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
  points: string[];
  check: string;
  hint: string;
  games: LessonGame[];
};

export const TOPICS: Topic[] = [
  {
    id: "bio-cell-cycle",
    subject: "Biology",
    subjectId: "biology",
    title: "The cell cycle",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Cell cycle on Khan Academy",
    labType: "cell_builder",
    mechanic: "build",
    partyMin: 3,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Tap mitosis stages in order.",
    points: [
      "A cell grows, copies its DNA, then splits.",
      "Mitosis order: prophase, metaphase, anaphase, telophase.",
      "In metaphase, chromosomes line up in the middle.",
    ],
    check: "Where are the chromosomes in metaphase?",
    hint: "Look at the middle of the cell, not the poles.",
    games: [
      { name: "Cell Division Rush", labType: "cell_builder", line: "Tap the stages in order." },
      { name: "Doodle Detective", labType: "concept_sketch", line: "Draw metaphase. Class guesses." },
    ],
    conceptTags: ["organelle", "metaphase", "cell_cycle"],
    levels: [
      { id: "build", goal: "Place nucleus, membrane, and mitochondria.", conceptTag: "organelle" },
      { id: "cycle", goal: "Run G1 → S → G2 → prophase → metaphase → anaphase → telophase.", conceptTag: "metaphase" },
    ],
  },
  {
    id: "bio-cell-parts",
    subject: "Biology",
    subjectId: "biology",
    title: "The cell parts and functions",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Cell parts on Khan Academy",
    labType: "concept_sketch",
    mechanic: "guess",
    partyMin: 2,
    partyMax: 5,
    liveOk: true,
    playPrompt: "Draw it. Guess it.",
    points: [
      "Nucleus: holds DNA and runs the cell.",
      "Cell membrane: controls what enters and leaves.",
      "Mitochondria: release energy from food.",
    ],
    check: "Which part releases energy?",
    hint: "It is not the control center.",
    games: [
      { name: "Doodle Detective", labType: "concept_sketch", line: "One draws an organelle. Others guess." },
      { name: "Build a Cell", labType: "cell_builder", line: "Place nucleus, membrane, mitochondria." },
    ],
    conceptTags: ["organelle", "nucleus", "membrane"],
    levels: [{ id: "draw", goal: "Draw, guess, then name the function.", conceptTag: "organelle" }],
  },
  {
    id: "bio-virus",
    subject: "Biology",
    subjectId: "biology",
    title: "Viruses and the immune system",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Biology on Khan Academy",
    labType: "virus_defense",
    mechanic: "battle",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Hit the virus.",
    points: ["A virus needs a host cell to copy itself.", "Antibodies mark a pathogen.", "Memory cells remember it."],
    check: "What does a virus need in order to copy itself?",
    hint: "It cannot do this alone.",
    games: [{ name: "Class vs Virus", labType: "virus_defense", line: "Right answers damage the virus." }],
    conceptTags: ["virus", "immune"],
    levels: [{ id: "wave", goal: "Drop virus HP to 0 before spread hits 100%.", conceptTag: "virus" }],
  },
  {
    id: "math-functions",
    subject: "General Math",
    subjectId: "math",
    title: "Functions",
    kaUrl: "https://www.khanacademy.org/math/senior-high-school-general-math",
    kaLabel: "Functions on Khan Academy",
    labType: "function_machine",
    mechanic: "solve",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Pick x. Output f(x).",
    points: [
      "A function takes an input x and gives one output f(x).",
      "f(x) = x + 2 means add 2 to whatever goes in.",
      "f(x) = 2x means double the input.",
    ],
    check: "If f(x) = x + 2 and x = 3, what is f(3)?",
    hint: "Add 2 to the input. Do not multiply.",
    games: [
      { name: "Function Machine", labType: "function_machine", line: "One input. One output." },
    ],
    conceptTags: ["function_notation", "linear_function"],
    levels: [
      { id: "plus-two", goal: "f(x) = x + 2", conceptTag: "function_notation" },
      { id: "double", goal: "f(x) = 2x", conceptTag: "linear_function" },
      { id: "slope-intercept", goal: "f(x) = 2x + 1", conceptTag: "linear_function" },
    ],
  },
  {
    id: "earth-solar",
    subject: "Earth Science",
    subjectId: "earth",
    title: "Universe and the solar system",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    kaLabel: "Earth Science on Khan Academy",
    labType: "concept_sketch",
    mechanic: "guess",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Draw it. Guess it.",
    points: [
      "The Sun is a star at the center.",
      "Planets orbit the Sun because of gravity.",
      "Earth is the third planet. The Moon orbits Earth.",
    ],
    check: "What keeps a planet in orbit?",
    hint: "It is a pull, not a push.",
    games: [
      { name: "Doodle Detective", labType: "concept_sketch", line: "Draw a body. Class guesses." },
    ],
    conceptTags: ["solar_system", "orbit"],
    levels: [{ id: "draw", goal: "Guess the body, then name the force or path.", conceptTag: "orbit" }],
  },
  {
    id: "earth-systems",
    subject: "Earth Science",
    subjectId: "earth",
    title: "Earth and earth systems",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    kaLabel: "Earth systems on Khan Academy",
    labType: "ecosystem",
    mechanic: "build",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Build the system. Survive a storm.",
    points: [
      "Earth systems work together: air, water, rock, and life.",
      "Producers make food. Consumers eat. Decomposers recycle.",
      "Remove one role and the system can collapse.",
    ],
    check: "What happens if decomposers disappear?",
    hint: "Waste and dead matter would pile up.",
    games: [
      { name: "Ecosystem Survival", labType: "ecosystem", line: "Add each role. Then a storm hits." },
      { name: "Doodle Detective", labType: "concept_sketch", line: "Draw one part of the system." },
    ],
    conceptTags: ["earth_system", "ecosystem"],
    levels: [{ id: "balance", goal: "Keep the system alive after a disturbance.", conceptTag: "earth_system" }],
  },
  {
    id: "bio-photo",
    subject: "Biology",
    subjectId: "biology",
    title: "Photosynthesis",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Biology on Khan Academy",
    labType: "plant_survival",
    mechanic: "simulate",
    partyMin: 2,
    partyMax: 40,
    liveOk: true,
    playPrompt: "Balance light, water, CO₂.",
    points: ["Plants use light, water, and CO₂.", "They make sugar and release oxygen."],
    check: "Name one input of photosynthesis.",
    hint: "Think light or a gas.",
    games: [{ name: "Plant Survival", labType: "plant_survival", line: "Set the inputs. Run a day." }],
    conceptTags: ["photosynthesis", "chloroplast"],
    levels: [{ id: "survive", goal: "Keep energy above 0 for three ticks.", conceptTag: "photosynthesis" }],
  },
];

export const SUBJECTS = [
  {
    id: "earth" as const,
    title: "Earth Science",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    lessons: ["earth-solar", "earth-systems"],
  },
  {
    id: "biology" as const,
    title: "Biology",
    kaUrl: "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    lessons: ["bio-cell-parts", "bio-cell-cycle"],
  },
];

export function getTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}

export function gameTitle(topicId: string, labType?: string) {
  const topic = getTopic(topicId);
  return topic?.games.find((g) => g.labType === labType)?.name ?? gameName(topicId);
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
