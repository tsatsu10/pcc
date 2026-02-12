"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Review page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Couldn't load review
          </h1>
          <p className="text-muted-foreground">
            We had trouble loading your review. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-6 p-4 rounded-lg bg-muted text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
