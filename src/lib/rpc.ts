"use client";

import { applyMove, emptySim, MAX_HEARTS, roleForIndex } from "@/lib/labs";
import { createClient } from "@/lib/supabase/client";
import { getTopic } from "@/lib/topics";
import type { LabType } from "@/lib/types";

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
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
        emailRedirectTo: `${window.location.origin}/class`,
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
    if (!user) return { user: null, classroom: null } as T;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) return { user: null, classroom: null } as T;
    let classroom = null;
    if (profile.role === "teacher") {
      const { data } = await supabase.from("classrooms").select("*").eq("teacher_id", user.id).maybeSingle();
      classroom = data;
    } else {
      const { data: en } = await supabase.from("enrollments").select("classroom_id").eq("student_id", user.id).maybeSingle();
      if (en) {
        const { data } = await supabase.from("classrooms").select("*").eq("id", en.classroom_id).maybeSingle();
        classroom = data;
      }
    }
    return {
      user: { id: profile.id, role: profile.role, name: profile.name, email: user.email, xp: profile.xp, streak: profile.streak },
      classroom,
    } as T;
  }

  if (!user) throw new Error("Sign in first.");

  if (op === "createClassroom") {
    const { data, error } = await supabase
      .from("classrooms")
      .insert({ teacher_id: user.id, name: String(body.name ?? "My class").trim() || "My class", code: code() })
      .select()
      .single();
    throwIf(error);
    return data as T;
  }

  if (op === "joinClassroom") {
    const raw = String(body.code ?? "").trim().toUpperCase();
    const { data: classroom, error } = await supabase.from("classrooms").select("*").eq("code", raw).maybeSingle();
    throwIf(error);
    if (!classroom) throw new Error("No class with that code. Check the six letters on the teacher’s screen.");
    const { error: enErr } = await supabase.from("enrollments").insert({ classroom_id: classroom.id, student_id: user.id });
    if (enErr && enErr.code !== "23505") throwIf(enErr);
    return classroom as T;
  }

  if (op === "kaSetup") {
    const { data, error } = await supabase
      .from("classrooms")
      .update({ ka_setup_complete: true })
      .eq("teacher_id", user.id)
      .select()
      .single();
    throwIf(error);
    return data as T;
  }

  if (op === "assign") {
    const topic = getTopic(String(body.topicId ?? ""));
    if (!topic) throw new Error("Unknown topic.");
    const { data: classroom } = await supabase.from("classrooms").select("id").eq("teacher_id", user.id).single();
    if (!classroom) throw new Error("Create a classroom first.");
    const { data, error } = await supabase
      .from("assignments")
      .insert({ classroom_id: classroom.id, topic_id: topic.id, lab_type: topic.labType })
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
    const me = (await rpc("me")) as {
      user: { id: string; role: string; name: string; email?: string; xp: number; streak: number };
      classroom: { id: string; name: string; code: string; ka_setup_complete: boolean; teacher_id: string } | null;
    };
    if (!me.classroom) {
      return { ...me, people: [], assignments: [], rooms: [], kaOpens: [], attempts: [] } as T;
    }
    const cid = me.classroom.id;
    const { data: assignments } = await supabase.from("assignments").select("*").eq("classroom_id", cid);
    const { data: enrollments } = await supabase.from("enrollments").select("student_id, joined_at").eq("classroom_id", cid);
    const ids = (enrollments ?? []).map((e) => e.student_id);
    const { data: peopleRows } = ids.length
      ? await supabase.from("profiles").select("id, name, xp, streak").in("id", ids)
      : { data: [] };
    const people = (peopleRows ?? []).map((p) => ({
      ...p,
      email: "",
      joinedAt: enrollments?.find((e) => e.student_id === p.id)?.joined_at,
    }));
    const { data: rooms } = await supabase.from("rooms").select("*").eq("classroom_id", cid);
    const roomIds = (rooms ?? []).map((r) => r.id);
    const { data: players } = roomIds.length
      ? await supabase.from("room_players").select("*").in("room_id", roomIds)
      : { data: [] };
    const playerIds = [...new Set((players ?? []).map((p) => p.user_id))];
    const { data: playerProfiles } = playerIds.length
      ? await supabase.from("profiles").select("id, name, xp").in("id", playerIds)
      : { data: [] };
    const roomsOut = (rooms ?? []).map((r) => ({
      ...r,
      labType: r.lab_type,
      assignmentId: r.assignment_id,
      stuckConcept: r.stuck_concept,
      levelIndex: r.level_index,
      players: (players ?? [])
        .filter((p) => p.room_id === r.id)
        .map((p) => {
          const pr = playerProfiles?.find((x) => x.id === p.user_id);
          return { ...p, userId: p.user_id, roleKey: p.role_key, name: pr?.name ?? "Student", xp: pr?.xp ?? 0 };
        }),
    }));
    const assignIds = (assignments ?? []).map((a) => a.id);
    const { data: kaOpens } = assignIds.length
      ? await supabase.from("ka_opens").select("*").in("assignment_id", assignIds)
      : { data: [] };
    const { data: attempts } = assignIds.length
      ? await supabase.from("attempts").select("*").in("assignment_id", assignIds)
      : { data: [] };
    return {
      user: me.user,
      classroom: {
        id: me.classroom.id,
        name: me.classroom.name,
        code: me.classroom.code,
        kaSetupComplete: me.classroom.ka_setup_complete,
        teacherId: me.classroom.teacher_id,
      },
      people,
      assignments: (assignments ?? []).map((a) => ({
        id: a.id,
        topicId: a.topic_id,
        labType: a.lab_type,
        classroomId: a.classroom_id,
      })),
      rooms: roomsOut,
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
        sim: emptySim(labType),
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
      for (const m of members ?? []) {
        await supabase.from("attempts").insert({
          assignment_id: room.assignment_id,
          room_id: roomId,
          student_id: m.user_id,
          passed: false,
          concept_tag: result.failTag,
          xp_awarded: 0,
        });
      }
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
        for (const m of members ?? []) {
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
        }
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

  throw new Error("Unknown operation");
}
