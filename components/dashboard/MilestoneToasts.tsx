"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/Toast";
import { getNewMilestonesAndSave, getMilestoneLabel } from "@/lib/milestone-toast";

export function MilestoneToasts() {
  const { toast } = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    fetch("/api/gamification", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.milestones?.reached) return;
        const newIds = getNewMilestonesAndSave(data.milestones.reached as string[]);
        newIds.forEach((id) => {
          const label = getMilestoneLabel(id);
          toast({ message: `You unlocked: ${label}` });
        });
      })
      .catch(() => {});
  }, [toast]);

  return null;
}
