"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderTabs, Shell } from "@/components/shell";
import { rpc } from "@/lib/rpc";
import type { PublicUser } from "@/lib/types";

export default function ClassLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    rpc<{ user: PublicUser | null }>("me").then((d) => {
      if (!d.user) router.replace("/login");
      else setUser(d.user);
    });
  }, [router]);

  if (!user) {
    return <p className="p-6 text-muted">Loading…</p>;
  }

  return (
    <Shell role={user.role} name={user.name}>
      <FolderTabs role={user.role} />
      {children}
    </Shell>
  );
}
