import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/utils.js";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "ss:flex ss:w-full ss:items-center ss:justify-between ss:gap-2 ss:rounded-xl ss:border ss:border-border ss:bg-background ss:p-3 ss:text-left ss:outline-none ss:cursor-pointer ss:transition-colors ss:hover:bg-secondary ss:focus-visible:ring-2 ss:focus-visible:ring-ring/40 ss:data-[placeholder]:text-muted-foreground ss:[&_svg]:shrink-0 ss:[&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="ss:size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  // Intentionally NOT wrapped in SelectPrimitive.Portal: the widget's design
  // tokens + `data-theme` are scoped to `.safe-stake`, and a portal to
  // document.body would escape that scope (losing the popover background and
  // theme). Rendering inline keeps the dropdown inside the themed root.
  return (
    <SelectPrimitive.Content
      data-slot="select-content"
      position={position}
      className={cn(
        "ss:relative ss:z-50 ss:max-h-(--radix-select-content-available-height) ss:min-w-(--radix-select-trigger-width) ss:overflow-hidden ss:rounded-xl ss:border ss:border-border ss:bg-popover ss:text-popover-foreground ss:shadow-md",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="ss:p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "ss:relative ss:flex ss:w-full ss:cursor-pointer ss:items-center ss:gap-2 ss:rounded-lg ss:py-2 ss:pr-8 ss:pl-2 ss:text-sm ss:outline-none ss:select-none ss:focus:bg-secondary ss:data-[disabled]:pointer-events-none ss:data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="ss:absolute ss:right-2 ss:flex ss:size-4 ss:items-center ss:justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="ss:size-4 ss:text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
