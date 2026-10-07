"use client";

import { useCallback, useEffect, useState } from "react";
import { rpc } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/client";

export function useSnapshot() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const next = await rpc("snapshot");
      setData(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load class");
    }
  }, []);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("class-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => load())
      .subscribe();
    const iv = setInterval(load, 4000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [load]);

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

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => load(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, () => load())
      .subscribe();
    const iv = setInterval(load, 2000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [load, roomId]);

  return { data, error, reload: load };
}
