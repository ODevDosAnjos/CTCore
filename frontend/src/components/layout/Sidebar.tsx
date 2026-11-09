import { useId, useState, type ReactNode } from "react";
import { ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, LogOut, Moon, Sparkles, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeProvider";
import type { NavGroup } from "./AppLayout";
import { BrandMark } from "./BrandMark";
import { iconFor } from "./icons";

const live = "hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-semibold";

export const badgeText = (n: number) => (n > 99 ? "99+" : String(n));

export interface SidebarProps {
  groups: NavGroup[];
  activeId: string;
  org?: string;
  roleLabel?: string;
  badges?: Record<string, number>;
  collapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
  /** "menu": versão do celular em tela cheia (itens maiores, grupos abertos, tema, Minha conta e Sair). */
  variant?: "side" | "menu";
  /** Seletor de unidade no topo do menu do celular. */
  unitSlot?: ReactNode;
}

// Menu escuro (tokens sidebar*): grupos que abrem e fecham, item ativo, contadores, rodapé e recolher a 72 px (D1, D2).
export function Sidebar({ groups, activeId, org, roleLabel, badges = {}, collapsed: collapsedProp = false, onToggle, onLogout, variant = "side", unitSlot }: SidebarProps) {
  const { t } = useTranslation();
  const uid = useId();
  const menu = variant === "menu";
  const collapsed = collapsedProp && !menu;
  const row = cn(
    "flex w-full items-center gap-3 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    menu ? "min-h-12 text-base" : "min-h-11",
  );
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.filter((g) => g.items.some((i) => i.id === activeId)).map((g) => g.id)));
  const flip = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (!n.delete(id)) n.add(id);
      return n;
    });

  const soon = t("layout.soon");
  const link = (i: NavGroup["items"][number], nested: boolean) => {
    const Icon = iconFor(i.icon);
    const n = badges[i.id] ?? 0;
    const badgeId = `${uid}-${i.id}`;
    const pad = cn(nested && !collapsed && "pl-6", collapsed && "justify-center px-0");
    if (i.disabled) {
      return (
        <button key={i.id} type="button" disabled title={collapsed ? `${i.label} · ${soon}` : soon} aria-label={collapsed ? `${i.label}, ${soon}` : undefined} className={cn(row, "opacity-60", pad)}>
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{i.label}</span>}
        </button>
      );
    }
    return (
      <a
        key={i.id}
        href={i.href}
        aria-current={i.id === activeId ? "page" : undefined}
        aria-label={collapsed ? i.label : undefined}
        aria-describedby={n > 0 && !collapsed ? badgeId : undefined}
        title={collapsed ? i.label : undefined}
        className={cn(row, live, pad)}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        {!collapsed && <span className="min-w-0 flex-1 truncate">{i.label}</span>}
        {n > 0 && !collapsed && (
          <span id={badgeId} hidden={false} aria-hidden="true" className="rounded-full bg-primary px-1.5 text-center text-xs font-semibold text-primary-foreground">{badgeText(n)}</span>
        )}
      </a>
    );
  };

  const footer = (label: string, Icon: typeof CircleHelp) => (
    <button
      type="button"
      disabled
      title={collapsed ? `${label} · ${soon}` : soon}
      aria-label={collapsed ? `${label}, ${soon}` : undefined}
      className={cn(row, "opacity-60", collapsed && "justify-center px-0")}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{label}</span>}
    </button>
  );

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", menu ? "w-full" : collapsed ? "w-18" : "w-62")}>
      {!menu && (
        <div className={cn("flex flex-col gap-1 px-4 py-4", collapsed && "items-center px-0")}>
          <BrandMark org={org} compact={collapsed} />
          {!collapsed && roleLabel && <p className="truncate pl-12 text-xs opacity-70">{t("layout.area", { role: roleLabel })}</p>}
        </div>
      )}
      {menu && unitSlot && <div className="px-4 pb-2">{unitSlot}</div>}
      <nav aria-label={t("layout.main")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {groups.map((g) => {
          if (g.items.length === 1 && g.items[0].id === g.id) return link(g.items[0], false);
          const expanded = menu || open.has(g.id);
          const GroupIcon = iconFor(g.icon);
          return (
            <div key={g.id} className={cn(menu && "border-t border-sidebar-accent pt-1")}>
              {!collapsed && (
                <button type="button" aria-expanded={expanded} onClick={() => !menu && flip(g.id)} className={cn(row, "font-medium hover:bg-sidebar-accent")}>
                  <GroupIcon aria-hidden="true" className="size-5 shrink-0" />
                  <span className="flex-1 text-left">{g.label}</span>
                  <ChevronRight aria-hidden="true" className={cn("size-4 transition-transform", expanded && "rotate-90")} />
                </button>
              )}
              {(collapsed || expanded) && <div className="flex flex-col gap-1">{g.items.map((i) => link(i, true))}</div>}
            </div>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1 border-t border-sidebar-accent p-2">
        {footer(t("layout.help"), CircleHelp)}
        {footer(t("layout.news"), Sparkles)}
        {menu && <ThemeRow className={row} />}
        {menu && (
          <a href="/conta" className={cn(row, live)}>
            <UserRound aria-hidden="true" className="size-5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t("layout.myAccount")}</span>
          </a>
        )}
        {menu && onLogout && (
          <button type="button" onClick={onLogout} className={cn(row, live)}>
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{t("auth.logout.label")}</span>
          </button>
        )}
        {!menu && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? t("layout.expand") : t("layout.collapse")}
            title={collapsed ? t("layout.expand") : undefined}
            className={cn(row, live, collapsed && "justify-center px-0")}
          >
            {collapsed ? <ChevronsRight aria-hidden="true" className="size-5" /> : <ChevronsLeft aria-hidden="true" className="size-5" />}
            {!collapsed && <span>{t("layout.collapse")}</span>}
          </button>
        )}
        {!collapsed && <p className="px-3 pt-1 text-xs opacity-70">{t("layout.madeWith")}</p>}
      </div>
    </div>
  );
}

// "Tema escuro" em linha (menu do celular): interruptor com o estado.
function ThemeRow({ className }: { className: string }) {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button type="button" role="switch" aria-checked={dark} onClick={toggle} className={cn(className, "hover:bg-sidebar-accent")}>
      <Moon aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{t("layout.darkTheme")}</span>
    </button>
  );
}
