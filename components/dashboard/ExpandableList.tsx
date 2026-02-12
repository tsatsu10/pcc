"use client";

import { useState } from "react";

type Props = {
  items: React.ReactNode[];
  initialVisible?: number;
  expandLabel?: string;
  collapseLabel?: string;
};

export function ExpandableList({
  items,
  initialVisible = 3,
  expandLabel = "Show more",
  collapseLabel = "Show less",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > initialVisible;
  const visible = expanded ? items : items.slice(0, initialVisible);

  return (
    <div className="space-y-2">
      <ul className="space-y-2 text-sm">
        {visible}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary font-medium hover:underline"
        >
          {expanded ? collapseLabel : `${expandLabel} (${items.length - initialVisible})`}
        </button>
      )}
    </div>
  );
}
