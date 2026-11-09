import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { usePopover } from "./usePopover";

const item = "flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Menu da conta na barra de cima: avatar, nome, perfil e seta; abre com "Minha conta" e "Sair da conta" (D4).
export function UserMenu({ name, roleLabel, onLogout }: { name: string; roleLabel?: string; onLogout?: () => void }) {
  const { t } = useTranslation();
  const { open, setOpen, root, button } = usePopover();
  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="sr-only">{t("layout.userMenu.label")}</span>
        <Avatar name={name} decorative />
        <span className="hidden min-w-0 text-left leading-tight lg:block">
          <span className="block max-w-40 truncate font-medium">{name}</span>
          {roleLabel && <span className="block text-xs text-muted-foreground">{roleLabel}</span>}
        </span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-52 rounded-card border bg-popover p-1 text-popover-foreground shadow-menu">
          <Link role="menuitem" to="/conta" onClick={() => setOpen(false)} className={item}>
            <UserRound aria-hidden="true" className="size-4" />
            {t("layout.myAccount")}
          </Link>
          {onLogout && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={item}
            >
              <LogOut aria-hidden="true" className="size-4" />
              {t("auth.logout.label")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
