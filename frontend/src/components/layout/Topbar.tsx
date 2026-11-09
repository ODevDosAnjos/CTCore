import type { ReactNode } from "react";
import { ArrowLeft, CircleHelp, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/theme/ThemeToggle";
import type { NavGroup } from "./AppLayout";
import { BrandMark } from "./BrandMark";
import { Breadcrumb } from "./Breadcrumb";

export interface TopbarProps {
  groups: NavGroup[];
  activeId: string;
  org?: string;
  /** Seletor de unidade: a versão do desktop (botão e lista) ou a do celular (botão e folha). */
  unit?: (variant: "desktop" | "mobile" | "compact") => ReactNode;
  bell?: ReactNode;
  userMenu?: ReactNode;
  children?: ReactNode;
}

// Barra de cima. Desktop (md+), numa só linha: trilha, unidade, busca, sino, tema, ajuda, divisória e conta.
// Celular: seta de voltar (fora do Início), marca, título e unidade à esquerda; lupa e sino à direita (R5, R7).
// Busca e ajuda ainda sem tela: desabilitadas com motivo ("Em breve").
export function Topbar({ groups, activeId, org, unit, bell, userMenu, children }: TopbarProps) {
  const { t } = useTranslation();
  const soon = t("layout.soon");
  const desktopUnit = unit?.("desktop");
  const mobileUnit = unit?.("compact");
  const title = groups.flatMap((g) => g.items).find((i) => i.id === activeId)?.label;
  return (
    <header className="flex flex-nowrap items-center gap-1 border-b px-4 py-2 md:gap-2">
      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumb groups={groups} activeId={activeId} />
      </div>
      <div className="hidden min-w-0 md:flex">{desktopUnit}</div>
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        {activeId !== "home" && (
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <a href="/" aria-label={t("layout.back")}>
              <ArrowLeft aria-hidden="true" />
            </a>
          </Button>
        )}
        <BrandMark org={org} compact className="shrink-0" />
        <div className="flex min-w-0 flex-col leading-tight">
          {title && <span className="truncate text-base font-semibold">{title}</span>}
          {mobileUnit}
        </div>
      </div>
      <Button variant="outline" disabled title={soon} className="shrink-0 gap-2 px-0 text-muted-foreground max-md:w-10 max-md:border-transparent max-md:bg-transparent lg:w-64 lg:justify-start lg:px-3 md:px-3">
        <Search aria-hidden="true" className="size-4" />
        <span className="sr-only md:not-sr-only">{t("layout.search")}</span>
        <kbd className="ml-auto hidden rounded border px-1 text-xs lg:inline">{t("layout.searchKey")}</kbd>
      </Button>
      {bell}
      <div className="hidden md:block">
        <ThemeToggle />
      </div>
      <Button variant="ghost" size="icon" disabled title={soon} aria-label={`${t("layout.help")}, ${soon}`} className="hidden shrink-0 md:inline-flex">
        <CircleHelp aria-hidden="true" />
      </Button>
      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border md:block" />
      <div className="hidden md:block">{userMenu}</div>
      {children}
    </header>
  );
}
