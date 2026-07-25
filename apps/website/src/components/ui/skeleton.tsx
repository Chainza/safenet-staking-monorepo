import * as React from "react";
import { cn } from "../../lib/utils.js";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[var(--page-muted)]/20", className)}
      {...props}
    />
  );
}

export { Skeleton };
