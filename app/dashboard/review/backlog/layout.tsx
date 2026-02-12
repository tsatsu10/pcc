import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backlog Review",
};

export default function BacklogReviewLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
