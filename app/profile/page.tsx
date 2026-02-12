import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";
import { ProfileForm } from "./ProfileForm";
import { ExportDataSection } from "./ExportDataSection";
import { ChangePasswordSection } from "./ChangePasswordSection";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true, id: true, email: true, name: true, timezone: true, goals: true, createdAt: true },
  });
  if (!user?.onboardingCompletedAt) redirect("/onboarding");
  const goals: string[] = Array.isArray(user?.goals)
    ? (user.goals as string[]).slice(0, 3).map((g) => (typeof g === "string" ? g : ""))
    : ["", "", ""];
  while (goals.length < 3) goals.push("");
  return (
    <>
      <Header />
      <main className="max-w-md mx-auto p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your account details.
        </p>
        <ProfileForm
          initialName={user.name ?? ""}
          initialTimezone={user.timezone ?? "UTC"}
          initialGoals={goals}
          email={user.email ?? ""}
          createdAt={user.createdAt.toISOString()}
        />
        <ChangePasswordSection />
        <ExportDataSection />
      </main>
    </>
  );
}
