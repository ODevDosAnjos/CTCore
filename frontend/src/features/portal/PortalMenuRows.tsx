import { useState, type ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { ComingSoon } from "@/components/ui/coming-soon";
import { cn } from "@/lib/utils";

const ROW = "flex min-h-11 w-full items-center gap-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const chevron = <ChevronRight aria-hidden className="ml-auto size-4 shrink-0 text-muted-foreground" />;

// Canvas PortalMInfo/PortalMConta: menu de linhas com ícone e seta, dentro de um cartão só.
export function MenuList({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul aria-label={label} className="divide-y rounded-card border bg-card px-4">
      {children}
    </ul>
  );
}

export function LinkRow({ icon: Icon, to, label }: { icon: LucideIcon; to: string; label: string }) {
  return (
    <li>
      <Link to={to} className={ROW}>
        <Icon aria-hidden className="size-[18px] shrink-0" />
        {label}
        {chevron}
      </Link>
    </li>
  );
}

// Linha que abre o conteúdo logo abaixo (sem rota nova): o conteúdo é o mesmo dos cartões do computador.
export function DisclosureRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button type="button" aria-expanded={open} className={ROW} onClick={() => setOpen(!open)}>
        <Icon aria-hidden className="size-[18px] shrink-0" />
        {label}
        <ChevronRight aria-hidden className={cn("ml-auto size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </li>
  );
}

// R3: item de sprint futura, visível e desabilitado com "Em breve".
export function SoonRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <li className="flex min-h-11 items-center gap-3 py-2 text-sm">
      <Icon aria-hidden className="size-[18px] shrink-0" />
      <ComingSoon tipAlign="end" variant="link" label={label} className="min-h-0 no-underline" />
    </li>
  );
}
