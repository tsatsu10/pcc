import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OnboardingLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true },
  });
  if (user?.onboardingCompletedAt) redirect("/dashboard");
  return <>{children}</>;
}
