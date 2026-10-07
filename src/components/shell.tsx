"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, QrCode, Users, BarChart3, FlaskConical } from "lucide-react";
import { rpc } from "@/lib/rpc";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";

const teacherTabs = [
  { href: "/class", label: "Stream", icon: BookOpen },
  { href: "/class/people", label: "People", icon: Users },
  { href: "/class/labs", label: "Labs", icon: FlaskConical },
  { href: "/class/insights", label: "Insights", icon: BarChart3 },
];

const studentTabs = [
  { href: "/class", label: "Class", icon: BookOpen },
  { href: "/class/labs", label: "Labs", icon: FlaskConical },
  { href: "/join", label: "Scan", icon: QrCode },
];

export function Shell({
  children,
  role,
  name,
}: {
  children: React.ReactNode;
  role: Role;
  name: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const tabs = role === "teacher" ? teacherTabs : studentTabs;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:max-w-3xl">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/class" className="flex min-h-11 items-center gap-2 font-extrabold">
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
      <main id="main" className="flex flex-1 flex-col px-4 py-4">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-lg grid-cols-4 md:max-w-3xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => {
            const on = path === t.href || (t.href !== "/class" && path.startsWith(t.href));
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

export function FolderTabs({ role }: { role: Role }) {
  const path = usePathname();
  const items =
    role === "teacher"
      ? [
          { href: "/class", label: "Stream" },
          { href: "/class/people", label: "People" },
          { href: "/class/labs", label: "Tables" },
          { href: "/class/insights", label: "Insights" },
        ]
      : [
          { href: "/class", label: "My class" },
          { href: "/class/labs", label: "Peer labs" },
        ];
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto">
      {items.map((item, i) => {
        const on = path === item.href;
        const colors = ["bg-primary", "bg-accent", "bg-[#e2a100]", "bg-[#c45c26]"];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "min-h-12 shrink-0 rounded-t-[10px] border border-b-0 border-line px-3 py-2 text-sm font-extrabold",
              on ? "bg-surface" : "bg-highlight/60 text-muted",
            )}
          >
            <span className={cn("mr-2 inline-block size-2 rounded-[2px]", colors[i % colors.length])} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
