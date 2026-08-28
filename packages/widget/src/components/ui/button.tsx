import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

// Disabled states keep full-contrast text on a muted fill rather than the
// usual opacity-50 wash — a disabled CTA must still be readable (reviewer
// feedback: low-contrast buttons hurt visibility).
const buttonVariants = cva(
  "ss:inline-flex ss:shrink-0 ss:items-center ss:justify-center ss:gap-2 ss:whitespace-nowrap ss:rounded-lg ss:font-semibold ss:cursor-pointer ss:outline-none ss:transition-all ss:focus-visible:ring-2 ss:focus-visible:ring-ring/40 ss:disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "ss:bg-primary ss:text-primary-foreground ss:hover:brightness-105 ss:disabled:bg-primary/60",
        outline:
          "ss:border ss:border-border ss:bg-transparent ss:hover:bg-secondary ss:disabled:text-muted-foreground",
        ghost: "ss:hover:bg-secondary ss:disabled:text-muted-foreground",
        destructive:
          "ss:bg-destructive ss:text-foreground ss:hover:brightness-105 ss:disabled:bg-destructive/60",
      },
      size: {
        default: "ss:h-10 ss:px-4 ss:text-sm",
        sm: "ss:h-8 ss:px-4 ss:text-sm",
        lg: "ss:h-12 ss:px-6 ss:text-base",
        icon: "ss:size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
