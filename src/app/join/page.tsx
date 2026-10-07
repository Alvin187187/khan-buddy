"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppChrome } from "@/components/app-chrome";
import { JoinForm } from "@/components/join-form";

function JoinInner() {
  const params = useSearchParams();
  const from = params.get("from") ?? "";
  const classId = from.match(/\/c\/([^/?]+)/)?.[1];
  return (
    <AppChrome classId={classId}>
      <JoinForm />
    </AppChrome>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}
