"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { rpc } from "@/lib/rpc";

function safeNext(raw: string | null) {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/home";
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [role, setRole] = useState<"teacher" | "student" | null>(
    params.get("role") === "teacher" || params.get("role") === "student" ? (params.get("role") as "teacher" | "student") : null,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!role) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
        <img src="/logo.png" alt="" className="h-14 w-auto" />
        <h1 className="mt-4 text-3xl font-black">Sign up</h1>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-[12px] border border-line bg-surface px-3"
            onClick={() => setRole("teacher")}
          >
            <span className="text-lg font-black">Teacher</span>
            <span className="text-sm text-muted">Run a class</span>
          </button>
          <button
            type="button"
            className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-[12px] border border-line bg-surface px-3"
            onClick={() => setRole("student")}
          >
            <span className="text-lg font-black">Student</span>
            <span className="text-sm text-muted">Join a class</span>
          </button>
        </div>
        <Link href="/" className="mt-6 text-sm font-bold text-muted">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <button type="button" className="self-start text-sm font-bold text-muted" onClick={() => setRole(null)}>
        ← {role === "teacher" ? "Teacher" : "Student"}
      </button>
      <h1 className="mt-4 text-3xl font-black">Create account</h1>
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (name.trim().length < 2) {
            setError("Add your name.");
            return;
          }
          if (password.length < 6) {
            setError("Password needs at least 6 characters.");
            return;
          }
          setPending(true);
          setError("");
          try {
            await rpc("signup", { name, email, password, role });
            router.push(next);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign up");
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Name" htmlFor="name">
          <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password (6+ characters)" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? (
          <p role="alert" className="text-sm font-bold text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <Link href="/login" className="mt-4 text-sm font-bold text-primary">
        I already have an account
      </Link>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
