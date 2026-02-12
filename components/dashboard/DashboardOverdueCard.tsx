"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { EmptyState } from "@/components/ui";
import { OverdueIcon } from "@/components/dashboard/DashboardIcons";
import { ExpandableList } from "@/components/dashboard/ExpandableList";

type Task = {
  id: string;
  title: string;
  deadline: string | null;
  project: { id: string; name: string };
};

export function DashboardOverdueCard({
  tasks,
  titleHref,
}: {
  tasks: Task[];
  titleHref: string;
}) {
  const hasOverdue = tasks.length > 0;

  return (
    <Card className={hasOverdue ? "border-destructive/30 bg-destructive/5" : ""}>
      <CardHeader>
        <Link href={titleHref}>
          <CardTitle className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
            <OverdueIcon />
            Overdue tasks
            {hasOverdue && (
              <span className="text-sm font-medium text-destructive">
                {tasks.length} overdue
              </span>
            )}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent>
        {!hasOverdue ? (
          <EmptyState
            variant="celebratory"
            icon={<OverdueIcon />}
            heading="Nothing overdue"
            description="You're on top of things."
            action={
              <Link href="/dashboard/tasks">
                <Button variant="secondary" size="sm">View tasks</Button>
              </Link>
            }
          />
        ) : (
          <>
            <ExpandableList
              items={tasks.map((t) => (
                <li key={t.id} className="truncate text-sm">
                  <Link
                    href={`/dashboard/projects/${t.project.id}`}
                    className="text-primary hover:underline"
                  >
                    {t.title}
                  </Link>
                  {t.deadline && (
                    <span className="text-muted-foreground ml-1">
                      · {new Date(t.deadline).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
              initialVisible={3}
              expandLabel="Show overdue"
            />
            <Link
              href={titleHref}
              className="mt-3 inline-block text-sm text-primary font-medium hover:underline"
            >
              View all tasks →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
