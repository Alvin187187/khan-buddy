import { bus } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const ping = () => controller.enqueue(encoder.encode(`event: ping\ndata: 1\n\n`));
      const send = () => controller.enqueue(encoder.encode(`event: update\ndata: 1\n\n`));
      ping();
      const onRoom = () => send();
      const onClass = () => send();
      if (roomId) bus.on(`room:${roomId}`, onRoom);
      bus.on("classroom", onClass);
      const iv = setInterval(ping, 15000);
      req.signal.addEventListener("abort", () => {
        clearInterval(iv);
        if (roomId) bus.off(`room:${roomId}`, onRoom);
        bus.off("classroom", onClass);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
