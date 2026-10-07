import { EventEmitter } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Store } from "./types";

const FILE = path.join(process.cwd(), "data", "store.json");

const empty = (): Store => ({
  users: [],
  classrooms: [],
  enrollments: [],
  assignments: [],
  kaOpens: [],
  rooms: [],
  roomPlayers: [],
  attempts: [],
});

let memory: Store | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export const bus = new EventEmitter();
bus.setMaxListeners(100);

async function load(): Promise<Store> {
  try {
    const raw = await readFile(FILE, "utf8");
    memory = JSON.parse(raw) as Store;
    return memory;
  } catch {
    memory = empty();
    return memory;
  }
}

async function persist(store: Store) {
  writeQueue = writeQueue.then(async () => {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
  });
  await writeQueue;
}

export async function readStore() {
  return load();
}

export async function mutate<T>(fn: (store: Store) => T): Promise<T> {
  const store = await load();
  const result = fn(store);
  await persist(store);
  return result;
}

export function emitRoom(roomId: string) {
  bus.emit(`room:${roomId}`);
  bus.emit("classroom");
}

export function emitClass() {
  bus.emit("classroom");
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function classCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
