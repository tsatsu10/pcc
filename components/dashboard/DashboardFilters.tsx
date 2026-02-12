"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Domain = { id: string; name: string };

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

export function DashboardFilters({ domains }: { domains: Domain[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDomain = searchParams.get("domain") ?? "";

  if (domains.length <= 1) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("domain", value);
    else params.delete("domain");
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="domain-filter" className="text-sm text-muted-foreground">
        Domain
      </label>
      <select
        id="domain-filter"
        value={currentDomain}
        onChange={handleChange}
        className={selectClass}
        aria-label="Filter by domain"
      >
        <option value="">All domains</option>
        {domains.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
