export type Role = "teacher" | "student";
export type LabType = "function_machine" | "cell_builder";
export type RoomStatus = "lobby" | "playing" | "complete";

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  passwordHash: string;
  xp: number;
  streak: number;
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

export type Enrollment = {
  classroomId: string;
  studentId: string;
  joinedAt: string;
};

export type Assignment = {
  id: string;
  classroomId: string;
  topicId: string;
  labType: LabType;
  createdAt: string;
};

export type KaOpen = {
  assignmentId: string;
  studentId: string;
  openedAt: string;
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

export type RoomPlayer = {
  roomId: string;
  userId: string;
  roleKey: string;
  joinedAt: string;
};

export type Attempt = {
  id: string;
  assignmentId: string;
  roomId: string;
  studentId: string;
  passed: boolean;
  conceptTag: string;
  xpAwarded: number;
  at: string;
};

export type Store = {
  users: User[];
  classrooms: Classroom[];
  enrollments: Enrollment[];
  assignments: Assignment[];
  kaOpens: KaOpen[];
  rooms: Room[];
  roomPlayers: RoomPlayer[];
  attempts: Attempt[];
};

export type PublicUser = Omit<User, "passwordHash">;
