import type { Metadata } from "next";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!note) return { title: "Note" };
  return { title: note.title };
}

export default function NoteDetailLayout({ children }: Props) {
  return children;
}
