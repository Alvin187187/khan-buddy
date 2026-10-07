"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { rpc } from "@/lib/rpc";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "teacher" ? "teacher" : "student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <h1 className="text-3xl font-black">Create your account</h1>
      <p className="mt-2 text-muted">Needed so teachers can see named insights — not nicknames.</p>
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError("");
          try {
            await rpc("signup", { name, email, password, role });
            router.push("/class");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign up");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          {(["student", "teacher"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={`rounded-[8px] border px-3 font-extrabold capitalize ${
                role === r ? "border-primary bg-highlight" : "border-line bg-surface"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <Field label="Display name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
