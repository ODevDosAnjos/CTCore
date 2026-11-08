import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const descId = React.useId();
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-input transition-colors after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        checked ? "bg-brand" : "bg-neutral",
      )}
    >
      <span aria-hidden className={cn("size-5 rounded-full bg-card shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
  if (!description) return control;
  return (
    <div className="flex items-start gap-3">
      {control}
      <span id={descId} className="text-xs text-muted-foreground">
        {description}
      </span>
    </div>
  );
}
