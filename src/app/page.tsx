import Link from "next/link";

export default function Home() {
  return (
    <div id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
      <p className="text-sm font-extrabold text-primary">Khan Buddy</p>
      <h1 className="mt-6 text-[2.4rem] font-black leading-[1.05]">Learn it. Play it.</h1>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup?role=teacher"
          className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-primary px-5 font-extrabold text-primary-ink"
        >
          Teacher
        </Link>
        <Link
          href="/signup?role=student"
          className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-line bg-surface px-5 font-extrabold"
        >
          Student
        </Link>
      </div>
      <Link href="/login" className="mt-4 font-extrabold text-primary">
        Sign in
      </Link>
    </div>
  );
}
