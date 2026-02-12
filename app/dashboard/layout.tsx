import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";
import { ReviewBanner } from "@/components/ReviewBanner";
import { ReviewGate } from "@/components/dashboard/ReviewGate";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { getReviewStatus } from "@/lib/review-status";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true },
  });
  if (!user?.onboardingCompletedAt) redirect("/onboarding");

  // FR-28/FR-30: Block dashboard until required review is submitted
  const reviewStatus = await getReviewStatus(prisma, session.user.id);

  return (
    <>
      <ReviewGate
        dailyRequired={reviewStatus.dailyRequired}
        weeklyRequired={reviewStatus.weeklyRequired}
      />
      <Header variant="full" />
      <ReviewBanner />
      <div className="pb-16 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
    </>
  );
}
