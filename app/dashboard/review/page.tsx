import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/ui";
import { ReviewIcon } from "@/components/dashboard/DashboardIcons";

export default async function ReviewHubPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const data = await getDashboardData(session.user.id);
  const anyDue = data.dailyRequired || data.weeklyRequired || data.monthlyRequired;

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reviews" }]} />
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <ReviewIcon />
        Reviews
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {anyDue ? "Some reviews are due. Complete them to stay on track." : "You're all caught up. Use these when you're ready."}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className={data.dailyRequired ? "border-warning/40 bg-warning/5" : ""}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <Link href="/dashboard/review/daily" className="hover:text-primary transition-colors">
                Daily review
              </Link>
              {data.dailyRequired && (
                <span className="text-xs font-normal text-warning">Due</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Reflect on today&apos;s focus sessions.
            </p>
            <Link href="/dashboard/review/daily">
              <span className="text-sm font-medium text-primary hover:underline">
                {data.dailyRequired ? "Do daily review" : "Open daily review"} →
              </span>
            </Link>
          </CardContent>
        </Card>

        <Card className={data.weeklyRequired ? "border-warning/40 bg-warning/5" : ""}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <Link href="/dashboard/review/weekly" className="hover:text-primary transition-colors">
                Weekly review
              </Link>
              {data.weeklyRequired && (
                <span className="text-xs font-normal text-warning">Due</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Project progress, priorities, and plan for next week.
            </p>
            <Link href="/dashboard/review/weekly">
              <span className="text-sm font-medium text-primary hover:underline">
                {data.weeklyRequired ? "Do weekly review" : "Open weekly review"} →
              </span>
            </Link>
          </CardContent>
        </Card>

        <Card className={data.monthlyRequired ? "border-warning/40 bg-warning/5" : ""}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <Link href="/dashboard/review/monthly" className="hover:text-primary transition-colors">
                Monthly review
              </Link>
              {data.monthlyRequired && (
                <span className="text-xs font-normal text-warning">Due</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Look back at the last 30 days and set focus for next month.
            </p>
            <Link href="/dashboard/review/monthly">
              <span className="text-sm font-medium text-primary hover:underline">
                {data.monthlyRequired ? "Do monthly review" : "Open monthly review"} →
              </span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Link href="/dashboard/review/backlog" className="hover:text-primary transition-colors">
                Backlog review
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Triage backlog and postponed tasks.
            </p>
            <Link href="/dashboard/review/backlog">
              <span className="text-sm font-medium text-primary hover:underline">
                Open backlog review →
              </span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Link href="/dashboard/review/past" className="hover:text-primary transition-colors">
                Past reviews
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              View your previous daily, weekly, and monthly reviews.
            </p>
            <Link href="/dashboard/review/past">
              <span className="text-sm font-medium text-primary hover:underline">
                View past reviews →
              </span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
