import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Focus",
};

export default function FocusLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
