import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Busca do canvas: caixa de 40 px com lupa à esquerda e texto de ajuda. */
export function SearchBox({ value, onChange, placeholder, "aria-label": ariaLabel, className }: { value: string; onChange: (v: string) => void; placeholder: string; "aria-label"?: string; className?: string }) {
  return (
    <span className={cn("relative block min-w-0", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label={ariaLabel ?? placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </span>
  );
}
