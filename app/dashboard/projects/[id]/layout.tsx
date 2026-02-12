import type { Metadata } from "next";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!project) return { title: "Project" };
  return { title: project.name };
}

export default function ProjectDetailLayout({ children }: Props) {
  return children;
}
