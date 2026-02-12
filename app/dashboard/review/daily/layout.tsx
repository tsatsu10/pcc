import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Review",
};

export default function DailyReviewLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
