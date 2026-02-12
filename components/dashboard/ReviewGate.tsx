"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * FR-28/FR-30: Blocks dashboard access until required daily or weekly review is submitted.
 * Redirects to the review page when due; allows access only to that review page until completed.
 */
export function ReviewGate({
  dailyRequired,
  weeklyRequired,
}: {
  dailyRequired: boolean;
  weeklyRequired: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!dailyRequired && !weeklyRequired) return;

    const onDailyPage = pathname.startsWith("/dashboard/review/daily");
    const onWeeklyPage = pathname.startsWith("/dashboard/review/weekly");

    if (dailyRequired && !onDailyPage) {
      router.replace("/dashboard/review/daily");
      return;
    }
    if (weeklyRequired && !onWeeklyPage) {
      router.replace("/dashboard/review/weekly");
      return;
    }
  }, [dailyRequired, weeklyRequired, pathname, router]);

  return null;
}
