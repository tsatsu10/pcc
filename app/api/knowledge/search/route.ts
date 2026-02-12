import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }
  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      domain: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      title: n.title,
      contentPreview: n.content.slice(0, 150) + (n.content.length > 150 ? "…" : ""),
      domain: n.domain,
      project: n.project,
      href: `/dashboard/knowledge/${n.id}`,
    }))
  );
}
