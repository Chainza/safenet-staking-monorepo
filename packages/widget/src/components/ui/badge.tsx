import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "ss:inline-flex ss:items-center ss:justify-center ss:gap-2 ss:w-fit ss:shrink-0 ss:whitespace-nowrap ss:rounded-full ss:font-mono ss:text-xs ss:font-medium",
  {
    variants: {
      variant: {
        default: "ss:bg-primary ss:text-primary-foreground",
        secondary: "ss:border ss:border-border ss:bg-secondary ss:text-foreground",
        outline: "ss:border ss:border-border ss:text-foreground",
        success: "ss:text-success",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
