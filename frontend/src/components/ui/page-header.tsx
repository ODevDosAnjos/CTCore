import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Título em caixa alta só por CSS (D6): o DOM guarda o texto original. */
export function PageHeader({ title, subtitle, actions, className, compact }: { title: string; subtitle?: string; actions?: ReactNode; className?: string; /** Barra de tela cheia do celular: título pequeno, sem caixa alta. */ compact?: boolean }) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className={cn("font-semibold leading-tight", compact ? "font-sans text-base" : "text-[28px] uppercase sm:text-[38px]")}>{title}</h1>
        {subtitle && <p className={cn("text-muted-foreground", compact ? "truncate text-xs" : "text-sm")}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
