import * as React from "react";
import { cn } from "../../lib/utils.js";

/** Minimal shadcn-style input reset; the field container supplies the framing. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ss:w-full ss:min-w-0 ss:bg-transparent ss:text-foreground ss:outline-none ss:placeholder:text-muted-foreground ss:disabled:cursor-not-allowed ss:disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
