export type Role = "teacher" | "student";

export type LabType =
  | "function_machine"
  | "cell_builder"
  | "concept_sketch"
  | "virus_defense"
  | "ecosystem"
  | "plant_survival"
  | "immune_defense";

export type Mechanic = "guess" | "battle" | "build" | "solve" | "simulate";

export type RoomStatus = "lobby" | "playing" | "complete";

export type PublicUser = {
  id: string;
  role: Role;
  name: string;
  email?: string;
  xp: number;
  streak: number;
};

export type ClassCard = {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  kaSetupComplete: boolean;
  youAre: Role;
};

export type User = PublicUser & {
  email: string;
  passwordHash: string;
  lastActiveAt: string;
};

export type Classroom = {
  id: string;
  teacherId: string;
  name: string;
  code: string;
  kaSetupComplete: boolean;
  createdAt: string;
};

export type Assignment = {
  id: string;
  classroomId: string;
  topicId: string;
  labType: LabType;
  createdAt: string;
};

export type Room = {
  id: string;
  classroomId: string;
  assignmentId: string;
  labType: LabType;
  hostId: string;
  status: RoomStatus;
  hearts: number;
  levelIndex: number;
  stuckConcept: string | null;
  sim: Record<string, unknown>;
  createdAt: string;
};

export type Store = {
  users: User[];
  classrooms: Classroom[];
  enrollments: { classroomId: string; studentId: string; joinedAt: string }[];
  assignments: Assignment[];
  kaOpens: { assignmentId: string; studentId: string; openedAt: string }[];
  rooms: Room[];
  roomPlayers: { roomId: string; userId: string; roleKey: string; joinedAt: string }[];
  attempts: {
    id: string;
    assignmentId: string;
    roomId: string;
    studentId: string;
    passed: boolean;
    conceptTag: string;
    xpAwarded: number;
    at: string;
  }[];
};
