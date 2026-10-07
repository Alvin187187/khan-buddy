import Link from "next/link";
import { Mark } from "@/components/ui";

export default function Home() {
  return (
    <div id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8 pb-[env(safe-area-inset-bottom)] md:max-w-3xl">
      <p className="text-sm font-extrabold text-primary">Khan Buddy</p>
      <h1 className="mt-6 text-[2.4rem] font-black leading-[1.05] tracking-tight md:text-5xl">
        Learn on Khan Academy. Then play it with a <Mark>buddy</Mark>.
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-muted">
        One classroom on your phone. Teachers assign official Khan Academy units.
        Students sign in, open KA, then join a pair or a table of 3–5 for a shared lab — not a class quiz.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup?role=teacher"
          className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-primary px-5 font-extrabold text-primary-ink"
        >
          I’m a teacher
        </Link>
        <Link
          href="/signup?role=student"
          className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-line bg-surface px-5 font-extrabold"
        >
          I’m a student
        </Link>
      </div>
      <p className="mt-3 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-extrabold text-primary">
          Sign in
        </Link>
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Khan Academy first", d: "Every assignment opens the real KA lesson." },
          { t: "2 or 3–5", d: "Labs only start when the table is the right size." },
          { t: "Named insights", d: "Teachers see who opened KA and where a lab got stuck." },
        ].map((c) => (
          <div key={c.t} className="rounded-[12px] border border-line bg-surface p-4">
            <p className="font-extrabold">{c.t}</p>
            <p className="mt-1 text-sm text-muted">{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
