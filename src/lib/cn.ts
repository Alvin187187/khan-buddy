export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function classHue(id: string) {
  const palettes = ["#0f766e", "#1865f2", "#c45c26", "#5b4bb4", "#0e7490", "#b45309"];
  let h = 0;
  for (const c of id) h += c.charCodeAt(0);
  return palettes[h % palettes.length];
}
