import { cn } from "@/lib/utils";

/** Cabeçalho de tela do portal: rótulo acima e título em caixa alta (só por CSS) (canvas PortalInicio). */
export function PortalHeading({ label, title, className }: { label?: string; title: string; className?: string }) {
  return (
    <header className={cn("min-w-0", className)}>
      {label && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>}
      <h1 className="text-[28px] font-semibold uppercase leading-tight sm:text-[38px]">{title}</h1>
    </header>
  );
}
