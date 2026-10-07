"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, QrCode, Users, BarChart3, Gamepad2, ClipboardList } from "lucide-react";
import { rpc } from "@/lib/rpc";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";

export function TopBar({ name }: { name: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link href="/home" className="flex min-h-11 items-center gap-2 font-extrabold">
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-primary text-sm text-primary-ink">
          KB
        </span>
        Khan Buddy
      </Link>
      <button
        className="text-sm font-bold text-muted"
        onClick={async () => {
          await rpc("logout");
          router.push("/");
          router.refresh();
        }}
      >
        {name.split(" ")[0]} · Sign out
      </button>
    </header>
  );
}

export function HomeShell({ children, name }: { children: React.ReactNode; name: string }) {
  const path = usePathname();
  const tabs = [
    { href: "/home", label: "Classes" },
    { href: "/join", label: "Scan" },
  ];
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <TopBar name={name} />
      <main id="main" className="flex flex-1 flex-col px-4 py-4">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-3xl grid-cols-2">
          {tabs.map((t) => {
            const on = t.href === "/join" ? path.startsWith("/join") : path === "/home";
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex min-h-14 items-center justify-center text-sm font-bold",
                  on ? "text-primary" : "text-muted",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function ClassShell({
  children,
  role,
  name,
  classId,
}: {
  children: React.ReactNode;
  role: Role;
  name: string;
  classId: string;
}) {
  const path = usePathname();
  const teacherTabs = [
    { href: `/c/${classId}`, label: "Stream", icon: BookOpen },
    { href: `/c/${classId}/work`, label: "Work", icon: ClipboardList },
    { href: `/c/${classId}/people`, label: "People", icon: Users },
    { href: `/c/${classId}/play`, label: "Play", icon: Gamepad2 },
    { href: `/c/${classId}/insights`, label: "Results", icon: BarChart3 },
  ];
  const studentTabs = [
    { href: `/c/${classId}`, label: "Stream", icon: BookOpen },
    { href: `/c/${classId}/work`, label: "Work", icon: ClipboardList },
    { href: `/c/${classId}/play`, label: "Play", icon: Gamepad2 },
    { href: `/c/${classId}/join`, label: "Scan", icon: QrCode },
  ];
  const tabs = role === "teacher" ? teacherTabs : studentTabs;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <TopBar name={name} />
      <main id="main" className="flex flex-1 flex-col px-4 py-4">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div
          className="mx-auto grid max-w-3xl"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map((t) => {
            const base = t.href.split("?")[0];
            const on =
              t.label === "Stream"
                ? path === `/c/${classId}`
                : t.label === "Scan"
                  ? path.includes("/join")
                  : t.label === "Play"
                    ? path.startsWith(`/c/${classId}/play`) || path.startsWith("/play/") || path.startsWith("/lab/")
                    : path === base || path.startsWith(base + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-bold",
                  on ? "text-primary" : "text-muted",
                )}
              >
                <Icon />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
