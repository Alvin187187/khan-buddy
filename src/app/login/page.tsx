"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { rpc } from "@/lib/rpc";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <h1 className="text-3xl font-black">Sign in</h1>
      <p className="mt-2 text-muted">Teachers and students use the same door.</p>
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError("");
          try {
            await rpc("login", { email, password });
            router.push("/class");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign in");
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
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
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Link href="/" className="mt-4 text-sm font-bold text-muted">
        Back
      </Link>
    </div>
  );
}
