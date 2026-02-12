import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Review",
};

export default function MonthlyReviewLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
