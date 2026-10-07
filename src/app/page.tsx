import Link from "next/link";

export default function Home() {
  return (
    <div id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <img src="/logo.png" alt="" className="h-20 w-auto" />
      <h1 className="mt-4 text-3xl font-black">Khan Buddy</h1>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/login"
          className="flex min-h-28 items-center justify-center rounded-[12px] bg-primary px-3 text-center text-lg font-black text-primary-ink"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="flex min-h-28 items-center justify-center rounded-[12px] border border-line bg-surface px-3 text-center text-lg font-black"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
