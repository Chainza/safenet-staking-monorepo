import * as React from "react";
import { cn } from "../../lib/utils.js";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "ss:rounded-xl ss:border ss:border-border ss:bg-card ss:text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("ss:p-4", className)} {...props} />;
}

export { Card, CardContent };
