import { draftMode } from "next/headers";
import { auth } from "~/server/auth";

// Enables Next.js Draft Mode so the preview iframe shows draft content.
// Requires an active admin session.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  (await draftMode()).enable();
  return Response.json({ ok: true });
}
