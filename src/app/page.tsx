import Link from "next/link";
import { SUBJECTS, getTopic } from "@/lib/topics";

export default function Home() {
  return (
    <div id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
      <img src="/logo.png" alt="Khan Buddy" className="h-16 w-auto self-start" />
      <h1 className="mt-6 text-[2.2rem] font-black leading-[1.05]">Pick a lesson. Put it on the board.</h1>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/signup?role=teacher" className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-primary px-5 font-extrabold text-primary-ink">
          Teacher
        </Link>
        <Link href="/signup?role=student" className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-line bg-surface px-5 font-extrabold">
          Student
        </Link>
      </div>
      <Link href="/login" className="mt-4 font-extrabold text-primary">
        Sign in
      </Link>
      <div className="mt-10 flex flex-col gap-6">
        {SUBJECTS.map((s) => (
          <section key={s.id}>
            <h2 className="text-lg font-black">{s.title}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {s.lessons.map((id) => (
                <li key={id} className="rounded-[12px] border border-line bg-surface px-4 py-3 font-extrabold">
                  {getTopic(id)?.title}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
