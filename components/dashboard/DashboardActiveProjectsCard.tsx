"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { EmptyState } from "@/components/ui";
import { ProjectsIcon } from "@/components/dashboard/DashboardIcons";
import { ExpandableList } from "@/components/dashboard/ExpandableList";

type Project = {
  id: string;
  name: string;
  taskCount: number;
};

export function DashboardActiveProjectsCard({
  projects,
}: {
  projects: Project[];
}) {
  const hasProjects = projects.length > 0;

  return (
    <Card>
      <CardHeader>
        <Link href="/dashboard/projects">
          <CardTitle className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
            <ProjectsIcon />
            Active projects
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent>
        {!hasProjects ? (
          <EmptyState
            icon={<ProjectsIcon />}
            heading="No active projects"
            description="Create a project and add tasks to see them here."
            action={
              <Link href="/dashboard/projects">
                <Button variant="secondary" size="sm">Add project</Button>
              </Link>
            }
          />
        ) : (
          <>
            <ExpandableList
              items={projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="text-primary hover:underline truncate"
                  >
                    {p.name}
                  </Link>
                  <span className="text-muted-foreground shrink-0">
                    {p.taskCount} task{p.taskCount !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
              initialVisible={5}
              expandLabel="Show projects"
            />
            <Link
              href="/dashboard/projects"
              className="mt-3 inline-block text-sm text-primary font-medium hover:underline"
            >
              All projects →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
