"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeShell } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";
import { classHue } from "@/lib/cn";
import { rpc } from "@/lib/rpc";
import type { ClassCard, PublicUser } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    rpc<{ user: PublicUser | null; classrooms: ClassCard[] }>("me").then((d) => {
      if (!d.user) router.replace("/login");
      else {
        setUser(d.user);
        setClasses(d.classrooms);
      }
    });
  }, [router]);

  if (!user) return <p className="p-6 text-muted">Loading…</p>;

  return (
    <HomeShell name={user.name}>
      <h1 className="text-2xl font-black">Classes</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {classes.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="block overflow-hidden rounded-[12px] border border-line bg-surface">
            <div className="h-16 px-4 py-3 text-white" style={{ background: classHue(c.id) }}>
              <p className="truncate font-black">{c.name}</p>
              <p className="text-xs opacity-90">{c.code}</p>
            </div>
          </Link>
        ))}
      </div>
      {user.role === "teacher" ? (
        <div className="mt-6 flex flex-col gap-3">
          <Field label="New class" htmlFor="cname">
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          {msg ? <p role="alert" className="text-sm font-bold text-danger">{msg}</p> : null}
          <Button
            onClick={async () => {
              try {
                const c = await rpc<ClassCard>("createClassroom", { name: name || "My class" });
                router.push(`/c/${c.id}`);
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "Could not create class");
              }
            }}
          >
            Create
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <Field label="Class code" htmlFor="code">
            <Input id="code" value={code} autoCapitalize="characters" onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </Field>
          {msg ? <p role="alert" className="text-sm font-bold text-danger">{msg}</p> : null}
          <Button
            onClick={async () => {
              try {
                const c = await rpc<ClassCard>("joinClassroom", { code });
                router.push(`/c/${c.id}`);
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "Could not join");
              }
            }}
          >
            Join
          </Button>
        </div>
      )}
    </HomeShell>
  );
}
