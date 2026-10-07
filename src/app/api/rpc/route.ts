import { NextResponse } from "next/server";
import {
  ActionError,
  assignTopic,
  bootstrap,
  classroomSnapshot,
  completeKaSetup,
  createClassroom,
  createRoom,
  joinClassroom,
  joinRoom,
  login,
  moveRoom,
  openKa,
  roomSnapshot,
  signup,
  startRoom,
} from "@/lib/actions";
import { clearSession, getSessionUserId, setSession } from "@/lib/session";
import type { LabType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const op = String(body.op ?? "");
    const userId = await getSessionUserId();

    if (op === "signup") {
      const user = await signup({
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        role: body.role === "teacher" ? "teacher" : "student",
      });
      await setSession(user.id);
      return NextResponse.json({ user });
    }
    if (op === "login") {
      const user = await login(String(body.email ?? ""), String(body.password ?? ""));
      await setSession(user.id);
      return NextResponse.json({ user });
    }
    if (op === "logout") {
      await clearSession();
      return NextResponse.json({ ok: true });
    }
    if (op === "me") {
      return NextResponse.json(await bootstrap(userId));
    }
    if (op === "createClassroom") {
      return NextResponse.json(await createClassroom(userId, String(body.name ?? "")));
    }
    if (op === "joinClassroom") {
      return NextResponse.json(await joinClassroom(userId, String(body.code ?? "")));
    }
    if (op === "kaSetup") {
      return NextResponse.json(await completeKaSetup(userId));
    }
    if (op === "assign") {
      return NextResponse.json(await assignTopic(userId, String(body.topicId ?? "")));
    }
    if (op === "openKa") {
      return NextResponse.json(await openKa(userId, String(body.assignmentId ?? "")));
    }
    if (op === "snapshot") {
      return NextResponse.json(await classroomSnapshot(userId));
    }
    if (op === "createRoom") {
      return NextResponse.json(
        await createRoom(userId, String(body.assignmentId ?? ""), body.labType as LabType),
      );
    }
    if (op === "joinRoom") {
      return NextResponse.json(await joinRoom(userId, String(body.roomId ?? "")));
    }
    if (op === "startRoom") {
      return NextResponse.json(await startRoom(userId, String(body.roomId ?? "")));
    }
    if (op === "move") {
      return NextResponse.json(
        await moveRoom(userId, String(body.roomId ?? ""), {
          type: String(body.type ?? ""),
          payload: (body.payload as Record<string, unknown>) ?? {},
        }),
      );
    }
    if (op === "room") {
      return NextResponse.json(await roomSnapshot(userId, String(body.roomId ?? "")));
    }

    return NextResponse.json({ error: "Unknown operation" }, { status: 400 });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
