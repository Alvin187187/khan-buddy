"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClassShell, HomeShell } from "@/components/shell";
import { rpc } from "@/lib/rpc";
import type { ClassCard, PublicUser } from "@/lib/types";

export function AppChrome({
  classId,
  children,
}: {
  classId?: string;
  children: React.ReactNode;
}) {
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
      const mine = classId ? d.classrooms.find((c) => c.id === classId) : undefined;
      if (mine) setYouAre(mine.youAre);
      else if (d.user.role === "teacher") setYouAre("teacher");
    });
  }, [router, classId]);

  if (!user) return <p className="p-6 text-muted">Loading…</p>;
  if (classId) {
    return (
      <ClassShell role={youAre} name={user.name} classId={classId}>
        {children}
      </ClassShell>
    );
  }
  return <HomeShell name={user.name}>{children}</HomeShell>;
}

