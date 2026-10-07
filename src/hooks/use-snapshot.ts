"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rpc } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/client";

function useDebounced(fn: () => void, ms: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(fn, ms);
  }, [fn, ms]);
}

export function useSnapshot(classroomId?: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!classroomId) return;
    try {
      const next = await rpc("snapshot", { classroomId });
      setData(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load class");
    }
  }, [classroomId]);

  const soft = useDebounced(load, 250);

  useEffect(() => {
    load();
    if (!classroomId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`class-${classroomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, soft)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, soft)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, soft)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, soft)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, soft)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_players" }, soft)
      .subscribe();
    const iv = setInterval(load, 8000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [load, classroomId, soft]);

  return { data, error, reload: load };
}

export function useRoom(roomId: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const next = await rpc("room", { roomId });
      setData(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load lab");
    }
  }, [roomId]);

  const soft = useDebounced(load, 180);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        soft,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, soft)
      .subscribe();
    const iv = setInterval(load, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [load, roomId, soft]);

  return { data, error, reload: load };
}

export function useLive(sessionId: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const next = await rpc("live", { sessionId });
      setData(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load live game");
    }
  }, [sessionId]);

  const soft = useDebounced(load, 150);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`live-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions", filter: `id=eq.${sessionId}` },
        soft,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "live_players" }, soft)
      .subscribe();
    const iv = setInterval(load, 4000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [load, sessionId, soft]);

  return { data, error, reload: load };
}
