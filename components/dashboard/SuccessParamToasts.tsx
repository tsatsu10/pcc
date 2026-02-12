"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/Toast";

type SuccessParamToastsProps = {
  reviewSaved?: boolean;
  onboarding?: boolean;
};

export function SuccessParamToasts({ reviewSaved, onboarding }: SuccessParamToastsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (reviewSaved) {
      done.current = true;
      toast({ message: "Review saved." });
      router.replace("/dashboard", { scroll: false });
    } else if (onboarding) {
      done.current = true;
      toast({ message: "You're all set. Welcome to your dashboard." });
      router.replace("/dashboard", { scroll: false });
    }
  }, [reviewSaved, onboarding, router, toast]);

  return null;
}
