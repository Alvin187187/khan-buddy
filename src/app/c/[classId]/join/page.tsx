"use client";

import { Suspense } from "react";
import { JoinForm } from "@/components/join-form";

export default function ClassJoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
