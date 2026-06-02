import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils.js";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("ss:flex ss:flex-col ss:gap-4", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "ss:inline-flex ss:h-10 ss:w-full ss:items-center ss:gap-1 ss:rounded-xl ss:border ss:border-border ss:bg-background ss:p-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "ss:inline-flex ss:flex-1 ss:items-center ss:justify-center ss:rounded-lg ss:py-2 ss:font-mono ss:text-xs ss:font-medium ss:uppercase ss:tracking-wider ss:text-muted-foreground ss:cursor-pointer ss:outline-none ss:transition-colors ss:focus-visible:ring-2 ss:focus-visible:ring-ring/40 ss:disabled:pointer-events-none ss:disabled:opacity-50 ss:data-[state=active]:bg-secondary ss:data-[state=active]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("ss:outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
