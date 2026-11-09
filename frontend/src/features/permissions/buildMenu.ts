import type { NavGroup } from "@/components/layout/AppLayout";
import { menuCatalog, type CatalogGroup } from "./menuCatalog";
import type { PermissionMap } from "./types";

// R7: só entram itens cujo nível não é NONE (disponíveis ou "Em breve", desabilitados), e grupos que ficarem com algum item; ordem do catálogo.
export function buildMenu(
  permissions: PermissionMap,
  t: (key: string) => string,
  catalog: CatalogGroup[] = menuCatalog,
): NavGroup[] {
  return catalog
    .map((g) => ({
      id: g.id,
      label: t(`menu.groups.${g.id}`),
      icon: g.icon,
      items: g.items
        .filter((i) => (i.available || i.soon) && permissions[i.permission] !== "NONE")
        .map((i) => ({ id: i.id, label: t(`menu.items.${i.id}`), href: i.href, icon: i.icon, ...(i.available ? {} : { disabled: true }) })),
    }))
    .filter((g) => g.items.length > 0);
}
