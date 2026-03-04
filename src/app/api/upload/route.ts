import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { auth } from "~/server/auth";
import { headers } from "next/headers";
import { db } from "~/server/db";
import { userProfile } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // Auth check — must be admin or editor
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await db
    .select({ role: userProfile.role })
    .from(userProfile)
    .where(eq(userProfile.userId, session.user.id))
    .get();
  const role = profile?.role ?? "viewer";
  if (role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = extname(file.name) || ".bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
