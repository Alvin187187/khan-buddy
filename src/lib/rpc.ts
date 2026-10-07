"use client";

import { applyMove, emptySim, MAX_HEARTS, roleForIndex } from "@/lib/labs";
import { createClient } from "@/lib/supabase/client";
import { getTopic } from "@/lib/topics";
import type { LabType } from "@/lib/types";

function code(n = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function throwIf(error: { message: string; code?: string } | null) {
  if (error) throw new Error(error.message);
}

function pinOf(sim: unknown) {
  const pin = (sim as { pin?: unknown } | null)?.pin;
  return typeof pin === "string" ? pin : "";
}

function scoresOf(sim: unknown) {
  const scores = (sim as { scores?: unknown } | null)?.scores;
  return scores && typeof scores === "object" ? (scores as Record<string, number>) : {};
}

function missingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || /could not find the table/i.test(error.message ?? "");
}

async function ensureStream(
  supabase: ReturnType<typeof createClient>,
  classroomId: string,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("rooms")
    .select("*")
    .eq("classroom_id", classroomId)
    .eq("lab_type", "stream")
    .limit(1)
    .maybeSingle();
  if (existing) return existing as { id: string; sim: Record<string, unknown> };
  const { data: assignment, error: aErr } = await supabase
    .from("assignments")
    .insert({ classroom_id: classroomId, topic_id: "stream", lab_type: "stream" })
    .select()
    .single();
  throwIf(aErr);
  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      classroom_id: classroomId,
      assignment_id: assignment.id,
      lab_type: "stream",
      host_id: userId,
      status: "complete",
      sim: { notes: [] },
    })
    .select()
    .single();
  throwIf(error);
  return room as { id: string; sim: Record<string, unknown> };
}

function mapClass(row: {
  id: string;
  name: string;
  code: string;
  teacher_id: string;
  ka_setup_complete: boolean;
}, youAre: "teacher" | "student") {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    teacherId: row.teacher_id,
    kaSetupComplete: row.ka_setup_complete,
    youAre,
  };
}

export async function rpc<T = unknown>(op: string, body: Record<string, unknown> = {}): Promise<T> {
  const supabase = createClient();

  if (op === "signup") {
    const role = body.role === "teacher" ? "teacher" : "student";
    const { data, error } = await supabase.auth.signUp({
      email: String(body.email ?? "").trim().toLowerCase(),
      password: String(body.password ?? ""),
      options: {
        data: { name: String(body.name ?? "").trim(), role },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });
    throwIf(error);
    if (!data.session) {
      throw new Error(
        "Account created. Confirm the email if asked, then sign in. For classroom testing, in Supabase turn off Authentication → Providers → Email → Confirm email.",
      );
    }
    return { user: { id: data.user!.id, role, name: String(body.name) } } as T;
  }

  if (op === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(body.email ?? "").trim().toLowerCase(),
      password: String(body.password ?? ""),
    });
    throwIf(error);
    if (!data.user) throw new Error("Sign in failed. Check your email and password.");
    return { user: { id: data.user.id } } as T;
  }

  if (op === "logout") {
    await supabase.auth.signOut();
    return { ok: true } as T;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (op === "me") {
    if (!user) return { user: null, classrooms: [] } as T;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) return { user: null, classrooms: [] } as T;
    const [{ data: taught }, { data: ens }] = await Promise.all([
      supabase.from("classrooms").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("classroom_id").eq("student_id", user.id),
    ]);
    const enrolledIds = (ens ?? []).map((e) => e.classroom_id);
    const { data: enrolled } = enrolledIds.length
      ? await supabase.from("classrooms").select("*").in("id", enrolledIds)
      : { data: [] };
    const classrooms = [
      ...(taught ?? []).map((c) => mapClass(c, "teacher")),
      ...(enrolled ?? []).map((c) => mapClass(c, "student")),
    ];
    return {
      user: {
        id: profile.id,
        role: profile.role,
        name: profile.name,
        email: user.email,
        xp: profile.xp,
        streak: profile.streak,
      },
      classrooms,
    } as T;
  }

  if (!user) throw new Error("Sign in first.");

  if (op === "createClassroom") {
    const { data, error } = await supabase
      .from("classrooms")
      .insert({ teacher_id: user.id, name: String(body.name ?? "My class").trim() || "My class", code: code() })
      .select()
      .single();
    if (error?.code === "23505") {
      throw new Error("You already have a class. Open it and put a lesson on the board.");
    }
    throwIf(error);
    return mapClass(data, "teacher") as T;
  }

  if (op === "joinClassroom") {
    const raw = String(body.code ?? "").trim().toUpperCase();
    const { data: classroom, error } = await supabase.from("classrooms").select("*").eq("code", raw).maybeSingle();
    throwIf(error);
    if (!classroom) throw new Error("No class with that code. Check the six letters on the teacher’s screen.");
    const { error: enErr } = await supabase.from("enrollments").insert({ classroom_id: classroom.id, student_id: user.id });
    if (enErr && enErr.code !== "23505") throwIf(enErr);
    return mapClass(classroom, "student") as T;
  }

  if (op === "kaSetup") {
    const classroomId = String(body.classroomId);
    const { data, error } = await supabase
      .from("classrooms")
      .update({ ka_setup_complete: true })
      .eq("id", classroomId)
      .eq("teacher_id", user.id)
      .select()
      .single();
    throwIf(error);
    return data as T;
  }

  if (op === "announce") {
    const classroomId = String(body.classroomId);
    const text = String(body.body ?? "").trim();
    if (!text) throw new Error("Write an announcement first.");
    const { error } = await supabase.from("announcements").insert({
      classroom_id: classroomId,
      author_id: user.id,
      body: text,
    });
    if (!error) return { ok: true } as T;
    if (!missingTable(error)) throwIf(error);
    const room = await ensureStream(supabase, classroomId, user.id);
    const notes = Array.isArray((room.sim as { notes?: unknown }).notes)
      ? ((room.sim as { notes: { id: string; body: string; author_id: string; created_at: string }[] }).notes)
      : [];
    const note = {
      id: crypto.randomUUID(),
      body: text,
      author_id: user.id,
      created_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase
      .from("rooms")
      .update({ sim: { ...(room.sim as object), notes: [note, ...notes].slice(0, 30) } })
      .eq("id", room.id);
    throwIf(upErr);
    return { ok: true } as T;
  }

  if (op === "assign") {
    const topic = getTopic(String(body.topicId ?? ""));
    if (!topic) throw new Error("Unknown topic.");
    const classroomId = String(body.classroomId ?? "");
    if (!classroomId) throw new Error("Pick a class first.");
    const { data, error } = await supabase
      .from("assignments")
      .insert({ classroom_id: classroomId, topic_id: topic.id, lab_type: topic.labType })
      .select()
      .single();
    throwIf(error);
    return data as T;
  }

  if (op === "openKa") {
    const { error } = await supabase.from("ka_opens").upsert({
      assignment_id: String(body.assignmentId),
      student_id: user.id,
      opened_at: new Date().toISOString(),
    });
    throwIf(error);
    return { ok: true } as T;
  }

  if (op === "snapshot") {
    const classroomId = String(body.classroomId ?? "");
    if (!classroomId) throw new Error("No class selected.");
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) throw new Error("Profile missing.");
    const { data: classroom, error: cErr } = await supabase.from("classrooms").select("*").eq("id", classroomId).single();
    throwIf(cErr);
    if (!classroom) throw new Error("Class not found.");

    const [
      { data: assignments },
      { data: enrollments },
      { data: rooms },
      annRes,
    ] = await Promise.all([
      supabase.from("assignments").select("*").eq("classroom_id", classroomId).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("student_id, joined_at").eq("classroom_id", classroomId),
      supabase.from("rooms").select("*").eq("classroom_id", classroomId).order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").eq("classroom_id", classroomId).order("created_at", { ascending: false }),
    ]);
    const roomList = rooms ?? [];
    const stream = roomList.find((r) => r.lab_type === "stream");
    const streamNotes = Array.isArray((stream?.sim as { notes?: unknown } | undefined)?.notes)
      ? ((stream!.sim as { notes: { id: string; body: string; author_id: string; created_at: string }[] }).notes)
      : [];
    const announcements = annRes.error
      ? streamNotes.map((n) => ({ id: n.id, body: n.body, author_id: n.author_id, created_at: n.created_at }))
      : annRes.data;
    const lives = roomList.filter((r) => r.lab_type !== "stream" && pinOf(r.sim));

    const ids = (enrollments ?? []).map((e) => e.student_id);
    const roomIds = roomList.map((r) => r.id);
    const assignIds = (assignments ?? []).map((a) => a.id);

    const [{ data: peopleRows }, { data: players }, { data: kaOpens }, { data: attempts }] =
      await Promise.all([
        ids.length ? supabase.from("profiles").select("id, name, xp, streak").in("id", ids) : Promise.resolve({ data: [] }),
        roomIds.length ? supabase.from("room_players").select("*").in("room_id", roomIds) : Promise.resolve({ data: [] }),
        assignIds.length ? supabase.from("ka_opens").select("*").in("assignment_id", assignIds) : Promise.resolve({ data: [] }),
        assignIds.length ? supabase.from("attempts").select("*").in("assignment_id", assignIds) : Promise.resolve({ data: [] }),
      ]);

    const playerIds = [...new Set((players ?? []).map((p) => p.user_id))];
    const extraIds = [...new Set(playerIds)];
    const { data: extraProfiles } = extraIds.length
      ? await supabase.from("profiles").select("id, name, xp").in("id", extraIds)
      : { data: [] };

    const people = (peopleRows ?? []).map((p) => ({
      ...p,
      email: "",
      joinedAt: enrollments?.find((e) => e.student_id === p.id)?.joined_at,
    }));

    const roomsOut = (rooms ?? []).map((r) => ({
      ...r,
      labType: r.lab_type,
      assignmentId: r.assignment_id,
      stuckConcept: r.stuck_concept,
      levelIndex: r.level_index,
      players: (players ?? [])
        .filter((p) => p.room_id === r.id)
        .map((p) => {
          const pr = extraProfiles?.find((x) => x.id === p.user_id);
          return { ...p, userId: p.user_id, roleKey: p.role_key, name: pr?.name ?? "Student", xp: pr?.xp ?? 0 };
        }),
    }));

    const livesOut = lives.map((s) => {
      const scores = scoresOf(s.sim);
      return {
        id: s.id,
        classroomId: s.classroom_id,
        topicId: (assignments ?? []).find((a) => a.id === s.assignment_id)?.topic_id ?? "",
        labType: s.lab_type,
        pin: pinOf(s.sim),
        status: s.status,
        sim: s.sim,
        players: (players ?? [])
          .filter((p) => p.room_id === s.id)
          .map((p) => {
            const pr = extraProfiles?.find((x) => x.id === p.user_id);
            return { userId: p.user_id, name: pr?.name ?? "Student", score: scores[p.user_id] ?? 0, roleKey: p.role_key };
          }),
      };
    });

    return {
      user: {
        id: profile.id,
        role: profile.role,
        name: profile.name,
        email: user.email,
        xp: profile.xp,
        streak: profile.streak,
      },
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        kaSetupComplete: classroom.ka_setup_complete,
        teacherId: classroom.teacher_id,
      },
      people,
      assignments: (assignments ?? []).map((a) => ({
        id: a.id,
        topicId: a.topic_id,
        labType: a.lab_type,
        classroomId: a.classroom_id,
      })),
      rooms: roomsOut,
      announcements: (announcements ?? []).map((a) => ({
        id: a.id,
        body: a.body,
        authorId: a.author_id,
        createdAt: a.created_at,
      })),
      lives: livesOut,
      kaOpens: (kaOpens ?? []).map((k) => ({
        assignmentId: k.assignment_id,
        studentId: k.student_id,
        openedAt: k.opened_at,
      })),
      attempts: (attempts ?? []).map((a) => ({
        ...a,
        assignmentId: a.assignment_id,
        studentId: a.student_id,
        roomId: a.room_id,
        conceptTag: a.concept_tag,
        xpAwarded: a.xp_awarded,
        passed: a.passed,
      })),
    } as T;
  }

  if (op === "createRoom") {
    const assignmentId = String(body.assignmentId);
    const labType = body.labType as LabType;
    const { data: assignment } = await supabase.from("assignments").select("*").eq("id", assignmentId).single();
    if (!assignment) throw new Error("Assign a Khan Academy unit first.");
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        classroom_id: assignment.classroom_id,
        assignment_id: assignmentId,
        lab_type: labType,
        host_id: user.id,
        status: "lobby",
        hearts: MAX_HEARTS,
        level_index: 0,
        sim: emptySim(labType, assignment.topic_id),
      })
      .select()
      .single();
    throwIf(error);
    const { error: pErr } = await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: user.id,
      role_key: roleForIndex(labType, 0),
    });
    throwIf(pErr);
    return { id: room.id, ...room } as T;
  }

  if (op === "joinRoom") {
    const roomId = String(body.roomId);
    const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    if (!room) throw new Error("That table was not found.");
    const { data: existing } = await supabase.from("room_players").select("*").eq("room_id", roomId);
    if (existing?.some((p) => p.user_id === user.id)) return room as T;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "teacher") throw new Error("Teachers observe this table. Students sit and play.");
    const { data: assignment } = await supabase.from("assignments").select("topic_id").eq("id", room.assignment_id).single();
    const topic = getTopic(assignment?.topic_id ?? "");
    const max = topic?.partyMax ?? 5;
    if ((existing?.length ?? 0) >= max) throw new Error(`This table is full (${max} students). Join another table.`);
    const { error } = await supabase.from("room_players").insert({
      room_id: roomId,
      user_id: user.id,
      role_key: roleForIndex(room.lab_type, existing?.length ?? 0),
    });
    throwIf(error);
    return room as T;
  }

  if (op === "startRoom") {
    const roomId = String(body.roomId);
    const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    if (!room) throw new Error("Table not found.");
    const { data: assignment } = await supabase.from("assignments").select("topic_id").eq("id", room.assignment_id).single();
    const topic = getTopic(assignment?.topic_id ?? "");
    const { count } = await supabase.from("room_players").select("*", { count: "exact", head: true }).eq("room_id", roomId);
    const min = topic?.partyMin ?? 2;
    if ((count ?? 0) < min) throw new Error(`Need ${min} signed-in students before this lab can start.`);
    const { error } = await supabase.from("rooms").update({ status: "playing" }).eq("id", roomId);
    throwIf(error);
    return { ok: true } as T;
  }

  if (op === "move") {
    const roomId = String(body.roomId);
    const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    if (!room) throw new Error("Table not found.");
    if (room.status !== "playing") throw new Error("The lab has not started yet.");
    const { data: assignment } = await supabase.from("assignments").select("topic_id").eq("id", room.assignment_id).single();
    const topic = getTopic(assignment?.topic_id ?? "");
    const result = applyMove(room.lab_type, room.sim as Record<string, unknown>, {
      type: String(body.type ?? ""),
      payload: { ...(body.payload as Record<string, unknown>), levelIndex: room.level_index },
    });
    const patch: Record<string, unknown> = { sim: result.sim };
    if (result.failTag) {
      patch.hearts = Math.max(0, room.hearts - 1);
      patch.stuck_concept = result.failTag;
      const { data: members } = await supabase.from("room_players").select("user_id").eq("room_id", roomId);
      await Promise.all(
        (members ?? []).map((m) =>
          supabase.from("attempts").insert({
            assignment_id: room.assignment_id,
            room_id: roomId,
            student_id: m.user_id,
            passed: false,
            concept_tag: result.failTag,
            xp_awarded: 0,
          }),
        ),
      );
      if ((patch.hearts as number) === 0) patch.status = "complete";
    }
    if (result.success) {
      const levels = topic?.levels.length ?? 1;
      patch.level_index = room.level_index + 1;
      patch.stuck_concept = null;
      if (room.lab_type === "function_machine") patch.sim = emptySim("function_machine");
      if ((patch.level_index as number) >= levels) {
        patch.status = "complete";
        const { data: members } = await supabase.from("room_players").select("user_id").eq("room_id", roomId);
        await Promise.all(
          (members ?? []).map(async (m) => {
            const { data: pr } = await supabase.from("profiles").select("xp, streak").eq("id", m.user_id).single();
            if (pr) {
              await supabase.from("profiles").update({ xp: pr.xp + 20, streak: pr.streak + 1 }).eq("id", m.user_id);
            }
            await supabase.from("attempts").insert({
              assignment_id: room.assignment_id,
              room_id: roomId,
              student_id: m.user_id,
              passed: true,
              concept_tag: topic?.levels.at(-1)?.conceptTag ?? "complete",
              xp_awarded: 20,
            });
          }),
        );
      }
    }
    const { error } = await supabase.from("rooms").update(patch).eq("id", roomId);
    throwIf(error);
    return { ok: true } as T;
  }

  if (op === "room") {
    const roomId = String(body.roomId);
    const { data: room, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    throwIf(error);
    if (!room) throw new Error("Table not found.");
    const { data: assignment } = await supabase.from("assignments").select("*").eq("id", room.assignment_id).single();
    const topic = assignment ? getTopic(assignment.topic_id) : undefined;
    const { data: players } = await supabase.from("room_players").select("*").eq("room_id", roomId);
    const ids = (players ?? []).map((p) => p.user_id);
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, name").in("id", ids) : { data: [] };
    return {
      room: {
        ...room,
        labType: room.lab_type,
        levelIndex: room.level_index,
        stuckConcept: room.stuck_concept,
      },
      topic,
      assignment: assignment
        ? { id: assignment.id, topicId: assignment.topic_id, labType: assignment.lab_type }
        : null,
      players: (players ?? []).map((p) => ({
        ...p,
        userId: p.user_id,
        roleKey: p.role_key,
        name: profiles?.find((x) => x.id === p.user_id)?.name ?? "Student",
      })),
      you: { id: user.id },
    } as T;
  }

  if (op === "createLive") {
    const classroomId = String(body.classroomId);
    const topic = getTopic(String(body.topicId ?? ""));
    if (!topic) throw new Error("Unknown topic.");
    const lab = (body.labType as LabType) || topic.labType;
    await supabase.from("rooms").update({ status: "complete" }).eq("classroom_id", classroomId).neq("status", "complete");
    const { data: assignment, error: aErr } = await supabase
      .from("assignments")
      .insert({ classroom_id: classroomId, topic_id: topic.id, lab_type: lab })
      .select()
      .single();
    throwIf(aErr);
    const pin = code(6);
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        classroom_id: classroomId,
        assignment_id: assignment.id,
        lab_type: lab,
        host_id: user.id,
        status: "lobby",
        hearts: MAX_HEARTS,
        level_index: 0,
        sim: { ...emptySim(lab, topic.id), pin, scores: {} },
      })
      .select()
      .single();
    throwIf(error);
    return { id: room.id, pin } as T;
  }

  if (op === "joinLive") {
    const pin = String(body.pin ?? "").trim().toUpperCase();
    const classCode = String(body.code ?? "").trim().toUpperCase();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "student" && classCode) {
      const { data: classroom } = await supabase.from("classrooms").select("id").eq("code", classCode).maybeSingle();
      if (classroom) {
        const { error: enErr } = await supabase
          .from("enrollments")
          .insert({ classroom_id: classroom.id, student_id: user.id });
        if (enErr && enErr.code !== "23505") throwIf(enErr);
      }
    }
    const { data: openRooms, error: roomErr } = await supabase.from("rooms").select("*").in("status", ["lobby", "playing"]);
    throwIf(roomErr);
    const session = (openRooms ?? []).find((r) => pinOf(r.sim) === pin && r.lab_type !== "stream");
    if (!session) throw new Error("No live game with that PIN. Scan the code on the board.");
    if (profile?.role !== "teacher") {
      const { error: enErr } = await supabase
        .from("enrollments")
        .insert({ classroom_id: session.classroom_id, student_id: user.id });
      if (enErr && enErr.code !== "23505") throwIf(enErr);
      const { data: existing } = await supabase
        .from("room_players")
        .select("user_id")
        .eq("room_id", session.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existing) {
        const { count } = await supabase
          .from("room_players")
          .select("*", { count: "exact", head: true })
          .eq("room_id", session.id);
        const { error } = await supabase.from("room_players").insert({
          room_id: session.id,
          user_id: user.id,
          role_key: roleForIndex(session.lab_type, count ?? 0),
        });
        throwIf(error);
      }
    }
    return { id: session.id, classroomId: session.classroom_id } as T;
  }

  if (op === "startLive") {
    const { error } = await supabase.from("rooms").update({ status: "playing" }).eq("id", String(body.sessionId));
    throwIf(error);
    return { ok: true } as T;
  }

  if (op === "endLive") {
    const { error } = await supabase.from("rooms").update({ status: "complete" }).eq("id", String(body.sessionId));
    throwIf(error);
    return { ok: true } as T;
  }

  if (op === "live") {
    const sessionId = String(body.sessionId);
    const { data: session, error } = await supabase.from("rooms").select("*").eq("id", sessionId).single();
    throwIf(error);
    if (!session || !pinOf(session.sim)) throw new Error("Live game not found.");
    const { data: assignment } = await supabase.from("assignments").select("topic_id").eq("id", session.assignment_id).maybeSingle();
    const topic = getTopic(assignment?.topic_id ?? "");
    const { data: classroom } = await supabase.from("classrooms").select("code").eq("id", session.classroom_id).maybeSingle();
    const { data: players } = await supabase.from("room_players").select("*").eq("room_id", sessionId);
    const ids = (players ?? []).map((p) => p.user_id);
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, name").in("id", ids) : { data: [] };
    const { data: meProfile } = await supabase.from("profiles").select("role, name").eq("id", user.id).single();
    const scores = scoresOf(session.sim);
    return {
      session: {
        id: session.id,
        classroomId: session.classroom_id,
        classroomCode: classroom?.code ?? "",
        topicId: assignment?.topic_id ?? "",
        labType: session.lab_type,
        pin: pinOf(session.sim),
        status: session.status,
        sim: session.sim,
        hostId: session.host_id,
      },
      topic,
      players: (players ?? []).map((p) => ({
        userId: p.user_id,
        score: scores[p.user_id] ?? 0,
        roleKey: p.role_key,
        name: profiles?.find((x) => x.id === p.user_id)?.name ?? "Student",
      })),
      you: { id: user.id, role: meProfile?.role, name: meProfile?.name },
    } as T;
  }

  if (op === "liveMove") {
    const sessionId = String(body.sessionId);
    const { data: session } = await supabase.from("rooms").select("*").eq("id", sessionId).single();
    if (!session) throw new Error("Live game not found.");
    if (session.status !== "playing") throw new Error("The teacher has not started yet.");
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    const result = applyMove(session.lab_type, session.sim as Record<string, unknown>, {
      type: String(body.type ?? ""),
      payload: { ...(body.payload as Record<string, unknown>), name: profile?.name ?? "Student" },
    });
    const prev = scoresOf(session.sim);
    const hit = (result.sim as { last?: boolean }).last === true || Boolean(result.success);
    const scores = { ...prev };
    if (hit) scores[user.id] = (prev[user.id] ?? 0) + 10;
    const sim = { ...result.sim, pin: pinOf(session.sim), scores };
    const patch: Record<string, unknown> = { sim };
    if (result.success || result.failTag) patch.status = "complete";
    const { error } = await supabase.from("rooms").update(patch).eq("id", sessionId);
    throwIf(error);
    const tag = result.failTag || ((result.sim as { last?: boolean | null }).last === false ? session.lab_type : "");
    if (result.success || tag) {
      await supabase.from("attempts").insert({
        assignment_id: session.assignment_id,
        room_id: session.id,
        student_id: user.id,
        passed: Boolean(result.success) && !result.failTag,
        concept_tag: result.failTag || tag || "review",
        xp_awarded: result.success ? 8 : 0,
      });
    }
    if (result.success) {
      const { data: pr } = await supabase.from("profiles").select("xp, streak").eq("id", user.id).single();
      if (pr) await supabase.from("profiles").update({ xp: pr.xp + 8, streak: pr.streak + 1 }).eq("id", user.id);
    }
    return { ok: true } as T;
  }

  throw new Error("Unknown operation");
}
