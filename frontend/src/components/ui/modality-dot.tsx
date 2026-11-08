import { cn } from "@/lib/utils";
import { avatarTone } from "./avatar";
import type { Tone } from "./status-tone";

// Classes completas (o Tailwind só enxerga texto literal). Cor estável pelo nome (D2).
const DOT_CLASS: Record<Tone, string> = {
  ok: "bg-ok-foreground",
  warn: "bg-warn-foreground",
  danger: "bg-danger-foreground",
  info: "bg-info-foreground",
  neutral: "bg-neutral-foreground",
  acc: "bg-acc-foreground",
};

export function ModalityDot({ name, label, className }: { name: string; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden="true" data-tone={avatarTone(name)} className={cn("size-2 shrink-0 rounded-full", DOT_CLASS[avatarTone(name)])} />
      {label ?? name}
    </span>
  );
}
