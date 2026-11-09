import { cn } from "@/lib/utils";

/** Cabeçalho de tela do portal: rótulo acima, título em caixa alta (só por CSS) e subtítulo opcional (canvas PortalInicio). */
export function PortalHeading({ label, title, subtitle, className }: { label?: string; title: string; subtitle?: string; className?: string }) {
  return (
    <header className={cn("min-w-0", className)}>
      {label && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>}
      <h1 className="text-[28px] font-semibold uppercase leading-tight sm:text-[38px]">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
