import { emptySim, applyMove, MAX_HEARTS, roleForIndex, cellReady } from "./labs";
import { classCode, emitClass, emitRoom, mutate, readStore, uid } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { toPublic } from "./public";
import { getTopic } from "./topics";
import type { LabType, PublicUser, Room } from "./types";

export class ActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function requireUser(userId: string | null) {
  if (!userId) throw new ActionError("Sign in first.", 401);
  return userId;
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "student";
}) {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || input.password.length < 6) {
    throw new ActionError("Name, email, and a password of 6+ characters are required.");
  }
  return mutate((s) => {
    if (s.users.some((u) => u.email === email)) {
      throw new ActionError("That email is already in use.");
    }
    const user = {
      id: uid("u"),
      role: input.role,
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
      xp: 0,
      streak: 0,
      lastActiveAt: new Date().toISOString(),
    };
    s.users.push(user);
    emitClass();
    return toPublic(user);
  });
}

export async function login(email: string, password: string) {
  const store = await readStore();
  const user = store.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ActionError("Email or password is wrong.", 401);
  }
  return toPublic(user);
}

export async function bootstrap(userId: string | null) {
  const store = await readStore();
  if (!userId) return { user: null as PublicUser | null, classroom: null, enrollment: null };
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { user: null, classroom: null, enrollment: null };
  const classroom =
    user.role === "teacher"
      ? store.classrooms.find((c) => c.teacherId === user.id) ?? null
      : (() => {
          const en = store.enrollments.find((e) => e.studentId === user.id);
          return en ? store.classrooms.find((c) => c.id === en.classroomId) ?? null : null;
        })();
  return { user: toPublic(user), classroom };
}

export async function createClassroom(userId: string | null, name: string) {
  const id = requireUser(userId);
  return mutate((s) => {
    const user = s.users.find((u) => u.id === id);
    if (!user || user.role !== "teacher") throw new ActionError("Only teachers can create a class.", 403);
    if (s.classrooms.some((c) => c.teacherId === id)) {
      throw new ActionError("This account already has a classroom.");
    }
    const classroom = {
      id: uid("c"),
      teacherId: id,
      name: name.trim() || "My class",
      code: classCode(),
      kaSetupComplete: false,
      createdAt: new Date().toISOString(),
    };
    s.classrooms.push(classroom);
    emitClass();
    return classroom;
  });
}

export async function joinClassroom(userId: string | null, code: string) {
  const id = requireUser(userId);
  return mutate((s) => {
    const user = s.users.find((u) => u.id === id);
    if (!user || user.role !== "student") throw new ActionError("Sign in as a student to join.", 403);
    const classroom = s.classrooms.find((c) => c.code === code.trim().toUpperCase());
    if (!classroom) throw new ActionError("No class with that code.");
    if (s.enrollments.some((e) => e.studentId === id && e.classroomId === classroom.id)) {
      return classroom;
    }
    s.enrollments.push({
      classroomId: classroom.id,
      studentId: id,
      joinedAt: new Date().toISOString(),
    });
    emitClass();
    return classroom;
  });
}

export async function completeKaSetup(userId: string | null) {
  const id = requireUser(userId);
  return mutate((s) => {
    const c = s.classrooms.find((x) => x.teacherId === id);
    if (!c) throw new ActionError("Create a classroom first.");
    c.kaSetupComplete = true;
    emitClass();
    return c;
  });
}

export async function assignTopic(userId: string | null, topicId: string) {
  const id = requireUser(userId);
  const topic = getTopic(topicId);
  if (!topic) throw new ActionError("Unknown topic.");
  return mutate((s) => {
    const c = s.classrooms.find((x) => x.teacherId === id);
    if (!c) throw new ActionError("Create a classroom first.");
    const assignment = {
      id: uid("a"),
      classroomId: c.id,
      topicId: topic.id,
      labType: topic.labType,
      createdAt: new Date().toISOString(),
    };
    s.assignments.push(assignment);
    emitClass();
    return assignment;
  });
}

export async function openKa(userId: string | null, assignmentId: string) {
  const id = requireUser(userId);
  return mutate((s) => {
    const a = s.assignments.find((x) => x.id === assignmentId);
    if (!a) throw new ActionError("Assignment not found.");
    const enrolled =
      s.classrooms.some((c) => c.id === a.classroomId && c.teacherId === id) ||
      s.enrollments.some((e) => e.classroomId === a.classroomId && e.studentId === id);
    if (!enrolled) throw new ActionError("Not in this class.", 403);
    const existing = s.kaOpens.find((k) => k.assignmentId === assignmentId && k.studentId === id);
    if (!existing) {
      s.kaOpens.push({
        assignmentId,
        studentId: id,
        openedAt: new Date().toISOString(),
      });
    }
    emitClass();
    return { ok: true };
  });
}

export async function classroomSnapshot(userId: string | null) {
  const id = requireUser(userId);
  const s = await readStore();
  const user = s.users.find((u) => u.id === id);
  if (!user) throw new ActionError("Unknown user.", 401);
  const classroom =
    user.role === "teacher"
      ? s.classrooms.find((c) => c.teacherId === id)
      : (() => {
          const en = s.enrollments.find((e) => e.studentId === id);
          return en ? s.classrooms.find((c) => c.id === en.classroomId) : undefined;
        })();
  if (!classroom) {
    return {
      user: toPublic(user),
      classroom: null,
      people: [],
      assignments: [],
      rooms: [],
      kaOpens: [],
      attempts: [],
    };
  }
  const people = s.enrollments
    .filter((e) => e.classroomId === classroom.id)
    .map((e) => {
      const u = s.users.find((x) => x.id === e.studentId);
      return u ? { ...toPublic(u), joinedAt: e.joinedAt } : null;
    })
    .filter(Boolean);
  const assignments = s.assignments.filter((a) => a.classroomId === classroom.id);
  const rooms = s.rooms
    .filter((r) => r.classroomId === classroom.id)
    .map((r) => ({
      ...r,
      players: s.roomPlayers
        .filter((p) => p.roomId === r.id)
        .map((p) => {
          const u = s.users.find((x) => x.id === p.userId);
          return { ...p, name: u?.name ?? "Student", xp: u?.xp ?? 0 };
        }),
    }));
  const kaOpens = s.kaOpens.filter((k) => assignments.some((a) => a.id === k.assignmentId));
  const attempts = s.attempts.filter((a) => assignments.some((x) => x.id === a.assignmentId));
  return {
    user: toPublic(user),
    classroom,
    people,
    assignments,
    rooms,
    kaOpens,
    attempts,
  };
}

export async function createRoom(
  userId: string | null,
  assignmentId: string,
  labType: LabType,
) {
  const id = requireUser(userId);
  return mutate((s) => {
    const a = s.assignments.find((x) => x.id === assignmentId);
    if (!a) throw new ActionError("Assign a Khan Academy unit first.");
    const enrolled =
      s.enrollments.some((e) => e.classroomId === a.classroomId && e.studentId === id) ||
      s.classrooms.some((c) => c.id === a.classroomId && c.teacherId === id);
    if (!enrolled) throw new ActionError("Not in this class.", 403);
    const room: Room = {
      id: uid("r"),
      classroomId: a.classroomId,
      assignmentId,
      labType,
      hostId: id,
      status: "lobby",
      hearts: MAX_HEARTS,
      levelIndex: 0,
      stuckConcept: null,
      sim: emptySim(labType) as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    };
    s.rooms.push(room);
    const roleKey = roleForIndex(labType, 0);
    s.roomPlayers.push({
      roomId: room.id,
      userId: id,
      roleKey,
      joinedAt: new Date().toISOString(),
    });
    emitRoom(room.id);
    return room;
  });
}

export async function joinRoom(userId: string | null, roomId: string) {
  const id = requireUser(userId);
  return mutate((s) => {
    const room = s.rooms.find((r) => r.id === roomId);
    if (!room) throw new ActionError("Room not found.", 404);
    const topic = getTopic(
      s.assignments.find((a) => a.id === room.assignmentId)?.topicId ?? "",
    );
    const max = topic?.partyMax ?? 5;
    const existing = s.roomPlayers.filter((p) => p.roomId === roomId);
    if (existing.some((p) => p.userId === id)) return room;
    if (existing.length >= max) throw new ActionError("This table is full.");
    const user = s.users.find((u) => u.id === id);
    if (user?.role === "teacher") throw new ActionError("Teachers observe; students play.");
    s.roomPlayers.push({
      roomId,
      userId: id,
      roleKey: roleForIndex(room.labType, existing.length),
      joinedAt: new Date().toISOString(),
    });
    emitRoom(roomId);
    return room;
  });
}

export async function startRoom(userId: string | null, roomId: string) {
  const id = requireUser(userId);
  return mutate((s) => {
    const room = s.rooms.find((r) => r.id === roomId);
    if (!room) throw new ActionError("Room not found.", 404);
    const topic = getTopic(
      s.assignments.find((a) => a.id === room.assignmentId)?.topicId ?? "",
    );
    const min = topic?.partyMin ?? 2;
    const count = s.roomPlayers.filter((p) => p.roomId === roomId).length;
    if (count < min) throw new ActionError(`Need ${min} signed-in students to start.`);
    const isMember = s.roomPlayers.some((p) => p.roomId === roomId && p.userId === id);
    const isTeacher = s.classrooms.some((c) => c.id === room.classroomId && c.teacherId === id);
    if (!isMember && !isTeacher) throw new ActionError("Not in this room.", 403);
    room.status = "playing";
    emitRoom(roomId);
    return room;
  });
}

export async function moveRoom(
  userId: string | null,
  roomId: string,
  move: { type: string; payload?: Record<string, unknown> },
) {
  const id = requireUser(userId);
  return mutate((s) => {
    const room = s.rooms.find((r) => r.id === roomId);
    if (!room) throw new ActionError("Room not found.", 404);
    if (room.status !== "playing") throw new ActionError("Lab has not started.");
    const isMember = s.roomPlayers.some((p) => p.roomId === roomId && p.userId === id);
    if (!isMember) throw new ActionError("Join this table first.", 403);
    const topic = getTopic(
      s.assignments.find((a) => a.id === room.assignmentId)?.topicId ?? "",
    );
    const result = applyMove(room.labType, room.sim, {
      ...move,
      payload: { ...move.payload, levelIndex: room.levelIndex },
    });
    room.sim = result.sim;
    if (result.failTag) {
      room.hearts = Math.max(0, room.hearts - 1);
      room.stuckConcept = result.failTag;
      const members = s.roomPlayers.filter((p) => p.roomId === roomId);
      for (const m of members) {
        s.attempts.push({
          id: uid("t"),
          assignmentId: room.assignmentId,
          roomId,
          studentId: m.userId,
          passed: false,
          conceptTag: result.failTag,
          xpAwarded: 0,
          at: new Date().toISOString(),
        });
      }
      if (room.hearts === 0) {
        room.status = "complete";
      }
    }
    if (result.success) {
      const levels = topic?.levels.length ?? 1;
      room.levelIndex += 1;
      room.stuckConcept = null;
      if (room.labType === "function_machine") {
        room.sim = emptySim("function_machine") as unknown as Record<string, unknown>;
      }
      if (room.levelIndex >= levels) {
        room.status = "complete";
        const members = s.roomPlayers.filter((p) => p.roomId === roomId);
        for (const m of members) {
          const u = s.users.find((x) => x.id === m.userId);
          if (u) {
            u.xp += 20;
            u.streak += 1;
          }
          s.attempts.push({
            id: uid("t"),
            assignmentId: room.assignmentId,
            roomId,
            studentId: m.userId,
            passed: true,
            conceptTag: topic?.levels.at(-1)?.conceptTag ?? "complete",
            xpAwarded: 20,
            at: new Date().toISOString(),
          });
        }
      }
    }
    emitRoom(roomId);
    return room;
  });
}

export async function roomSnapshot(userId: string | null, roomId: string) {
  const id = requireUser(userId);
  const s = await readStore();
  const room = s.rooms.find((r) => r.id === roomId);
  if (!room) throw new ActionError("Room not found.", 404);
  const inClass =
    s.classrooms.some((c) => c.id === room.classroomId && c.teacherId === id) ||
    s.enrollments.some((e) => e.classroomId === room.classroomId && e.studentId === id);
  if (!inClass) throw new ActionError("Not in this class.", 403);
  const assignment = s.assignments.find((a) => a.id === room.assignmentId);
  const topic = assignment ? getTopic(assignment.topicId) : undefined;
  const players = s.roomPlayers
    .filter((p) => p.roomId === roomId)
    .map((p) => {
      const u = s.users.find((x) => x.id === p.userId);
      return { ...p, name: u?.name ?? "Student" };
    });
  return {
    room,
    topic,
    assignment,
    players,
    cellBuilt: cellReady(room.sim),
    you: { id },
  };
}
