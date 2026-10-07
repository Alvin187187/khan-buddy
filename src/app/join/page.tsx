"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { rpc } from "@/lib/rpc";

function JoinInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c);
  }, [params]);

  async function go() {
    try {
      const me = await rpc<{ user: { role: string } | null }>("me");
      if (!me.user) {
        router.push(`/login`);
        return;
      }
      await rpc("joinClassroom", { code });
      router.push("/class");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5">
      <h1 className="text-3xl font-black">Join class</h1>
      <p className="text-muted">Scan the teacher QR or type the class code. You must be signed in.</p>
      <Field label="Class code" htmlFor="code">
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
        />
      </Field>
      {error ? <p className="font-bold text-danger">{error}</p> : null}
      <Button onClick={go}>Join</Button>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}
