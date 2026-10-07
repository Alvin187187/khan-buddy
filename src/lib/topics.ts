import type { LabType } from "./types";

export type Topic = {
  id: string;
  subject: string;
  title: string;
  kaUrl: string;
  kaLabel: string;
  labType: LabType;
  partyMin: number;
  partyMax: number;
  conceptTags: string[];
  levels: { id: string; goal: string; conceptTag: string }[];
};

export const TOPICS: Topic[] = [
  {
    id: "bio-cell-cycle",
    subject: "SHS Biology 1",
    title: "The cell cycle",
    kaUrl:
      "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Open cell cycle on Khan Academy",
    labType: "cell_builder",
    partyMin: 3,
    partyMax: 5,
    conceptTags: ["organelle", "metaphase", "cell_cycle"],
    levels: [
      {
        id: "build",
        goal: "Place nucleus, membrane, and mitochondria so the cell can live.",
        conceptTag: "organelle",
      },
      {
        id: "cycle",
        goal: "Run the cell cycle in order. Do not skip metaphase.",
        conceptTag: "metaphase",
      },
    ],
  },
  {
    id: "bio-cell-parts",
    subject: "SHS Biology 1",
    title: "Cell parts and functions",
    kaUrl:
      "https://www.khanacademy.org/science/strengthened-shs-biology-1",
    kaLabel: "Open cell parts on Khan Academy",
    labType: "cell_builder",
    partyMin: 3,
    partyMax: 5,
    conceptTags: ["organelle", "nucleus", "membrane"],
    levels: [
      {
        id: "build",
        goal: "Match each organelle to its job, then keep the cell alive.",
        conceptTag: "organelle",
      },
    ],
  },
  {
    id: "math-functions",
    subject: "SHS General Math",
    title: "Functions",
    kaUrl:
      "https://www.khanacademy.org/math/senior-high-school-general-math",
    kaLabel: "Open functions on Khan Academy",
    labType: "function_machine",
    partyMin: 2,
    partyMax: 2,
    conceptTags: ["function_notation", "linear_function"],
    levels: [
      {
        id: "plus-two",
        goal: "One buddy picks x. The other outputs f(x) = x + 2.",
        conceptTag: "function_notation",
      },
      {
        id: "double",
        goal: "Match points to f(x) = 2x on the shared graph.",
        conceptTag: "linear_function",
      },
      {
        id: "slope-intercept",
        goal: "Build f(x) = 2x + 1 together.",
        conceptTag: "linear_function",
      },
    ],
  },
  {
    id: "earth-solar",
    subject: "SHS Earth Science",
    title: "Universe and the solar system",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    kaLabel: "Open Earth Science on Khan Academy",
    labType: "cell_builder",
    partyMin: 3,
    partyMax: 5,
    conceptTags: ["solar_system", "orbit"],
    levels: [
      {
        id: "build",
        goal: "Treat the cell as a system model: every part has a job, like bodies in a system.",
        conceptTag: "solar_system",
      },
    ],
  },
  {
    id: "earth-systems",
    subject: "SHS Earth Science",
    title: "Earth and earth systems",
    kaUrl: "https://www.khanacademy.org/science/shs-earth-science",
    kaLabel: "Open Earth systems on Khan Academy",
    labType: "cell_builder",
    partyMin: 3,
    partyMax: 5,
    conceptTags: ["earth_system"],
    levels: [
      {
        id: "build",
        goal: "Keep the living system balanced — each role is a sphere of Earth.",
        conceptTag: "earth_system",
      },
    ],
  },
];

export function getTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}

export function reteachUrl(conceptTag: string) {
  if (conceptTag === "function_notation" || conceptTag === "linear_function") {
    return "https://www.khanacademy.org/math/senior-high-school-general-math";
  }
  if (conceptTag === "solar_system" || conceptTag === "earth_system") {
    return "https://www.khanacademy.org/science/shs-earth-science";
  }
  return "https://www.khanacademy.org/science/strengthened-shs-biology-1";
}
