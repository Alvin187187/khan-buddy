import type { PublicUser, User } from "./types";

export function toPublic(u: User): PublicUser {
  const { passwordHash: _, ...rest } = u;
  return rest;
}
