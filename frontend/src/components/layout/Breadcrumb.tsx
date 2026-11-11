import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NavGroup } from "./AppLayout";

// A trilha vem dos grupos do menu e do item ativo: "Grupo › Tela" (o grupo some quando é só o Início).
export function Breadcrumb({ groups, activeId, trail }: { groups: NavGroup[]; activeId: string; trail?: string }) {
  const { t } = useTranslation();
  const group = groups.find((g) => g.items.some((i) => i.id === activeId));
  const item = group?.items.find((i) => i.id === activeId);
  if (!group || !item) return null;
  const single = group.items.length === 1 && group.id === item.id;
  return (
    <nav aria-label={t("layout.breadcrumb")} className="min-w-0">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {!single && (
          <>
            <li className="truncate">{group.label}</li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
          </>
        )}
        {trail ? (
          <>
            <li className="truncate">
              <a href={item.href} className="hover:underline">
                {item.label}
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="truncate font-medium text-foreground">
              {trail}
            </li>
          </>
        ) : (
          <li aria-current="page" className="truncate font-medium text-foreground">
            {item.label}
          </li>
        )}
      </ol>
    </nav>
  );
}
