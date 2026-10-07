"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { rpc } from "@/lib/rpc";

export function JoinForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"class" | "live">(params.get("pin") ? "live" : "class");
  const [code, setCode] = useState(params.get("code") ?? "");
  const [pin, setPin] = useState(params.get("pin") ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const c = params.get("code");
    const p = params.get("pin");
    if (c) setCode(c);
    if (p) {
      setPin(p);
      setMode("live");
    }
  }, [params]);

  async function go() {
    setPending(true);
    setError("");
    try {
      const me = await rpc<{ user: { role: string } | null }>("me");
      if (!me.user) {
        const next = `/join?${params.toString()}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (mode === "live") {
        const s = await rpc<{ id: string }>("joinLive", { pin });
        router.push(`/play/${s.id}`);
        return;
      }
      const c = await rpc<{ id: string }>("joinClassroom", { code });
      router.push(`/c/${c.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Join</h1>
      <div className="grid grid-cols-2 gap-2">
        {(["class", "live"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-[8px] border px-3 font-extrabold ${
              mode === m ? "border-primary bg-highlight" : "border-line bg-surface"
            }`}
          >
            {m === "class" ? "Class" : "PIN"}
          </button>
        ))}
      </div>
      {mode === "class" ? (
        <Field label="Class code" htmlFor="code">
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
        </Field>
      ) : (
        <Field label="PIN" htmlFor="pin">
          <Input
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
        </Field>
      )}
      {error ? (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      ) : null}
      <Button onClick={go} disabled={pending}>
        {pending ? "Joining…" : "Join"}
      </Button>
    </div>
  );
}
