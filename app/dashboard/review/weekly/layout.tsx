import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Review",
};

export default function WeeklyReviewLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
