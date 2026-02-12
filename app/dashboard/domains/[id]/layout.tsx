import type { Metadata } from "next";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const domain = await prisma.domain.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!domain) return { title: "Domain" };
  return { title: domain.name };
}

export default function DomainDetailLayout({ children }: Props) {
  return children;
}
