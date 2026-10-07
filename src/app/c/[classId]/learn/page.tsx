"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getTopic } from "@/lib/topics";
import { rpc } from "@/lib/rpc";

function LearnInner() {
  const { classId } = useParams<{ classId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const topic = getTopic(params.get("topic") ?? "");
  const assignmentId = params.get("assignment");

  useEffect(() => {
    if (!topic) {
      router.replace(`/c/${classId}/work`);
      return;
    }
    if (assignmentId) rpc("openKa", { assignmentId }).catch(() => {});
    window.location.assign(topic.kaUrl);
  }, [topic, assignmentId, classId, router]);

  return <p className="text-muted">Opening Khan Academy…</p>;
}

export default function LearnPage() {
  return (
    <Suspense>
      <LearnInner />
    </Suspense>
  );
}
