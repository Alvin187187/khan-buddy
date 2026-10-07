import { redirect } from "next/navigation";

export default async function WorkRedirect({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  redirect(`/c/${classId}`);
}
