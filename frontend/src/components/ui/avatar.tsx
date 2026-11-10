import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_CLASS, type Tone } from "./status-tone";

const PALETTE: Tone[] = ["ok", "warn", "danger", "info", "neutral", "acc"];

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((w) => Array.from(w)[0]).join("").toUpperCase();
}

// Cor estável: a mesma pessoa tem sempre o mesmo tom.
export function avatarTone(name: string): Tone {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ name, className, decorative = false, size = "md" }: { name: string; className?: string; decorative?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      data-tone={avatarTone(name)}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", size === "sm" ? "size-8 text-[11px]" : size === "lg" ? "size-16 text-lg" : "size-9 text-xs", TONE_CLASS[avatarTone(name)], className)}
    >
      {initials(name)}
    </span>
  );
}

export function Person({ name, secondary, className, size }: { name: string; secondary?: ReactNode; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar name={name} decorative size={size} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
    </div>
  );
}
