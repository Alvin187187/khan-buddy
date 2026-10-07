"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassShell } from "@/components/shell";
import { rpc } from "@/lib/rpc";
import type { ClassCard, PublicUser } from "@/lib/types";

export default function ClassLayout({ children }: { children: React.ReactNode }) {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [youAre, setYouAre] = useState<"teacher" | "student">("student");

  useEffect(() => {
    rpc<{ user: PublicUser | null; classrooms: ClassCard[] }>("me").then((d) => {
      if (!d.user) {
        router.replace("/login");
        return;
      }
      setUser(d.user);
      try {
        localStorage.setItem("kb-class", classId);
      } catch {
        /* ignore */
      }
      const mine = d.classrooms.find((c) => c.id === classId);
      if (mine) setYouAre(mine.youAre);
      else if (d.user.role === "teacher") setYouAre("teacher");
    });
  }, [router, classId]);

  if (!user) return <p className="p-6 text-muted">Loading…</p>;

  return (
    <ClassShell role={youAre} name={user.name} classId={classId}>
      {children}
    </ClassShell>
  );
}
