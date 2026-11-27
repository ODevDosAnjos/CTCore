import { generatePath } from "react-router";
import { menuGroups, routes } from "@/routes";
import type { Permission } from "./types";

export interface CatalogItem {
  id: string;
  permission: Permission;
  href: string;
  /** D7: só vira true no item que entrega a tela; o menu nunca aponta para endereço inexistente. */
  available: boolean;
  /** Item de sprint futura que o canvas mostra: aparece desabilitado "Em breve" (sem rota), só para quem teria a permissão. */
  soon?: boolean;
  /** Sem a permissão do item, quem tem esta o vê desabilitado "Em breve". */
  soonFor?: Permission;
  /** Ícone (lucide-react) do menu lateral; o mapa nome -> componente fica em `components/layout/icons.ts`. */
  icon: string;
}
export interface CatalogGroup {
  id: string;
  /** Ícone do grupo no menu lateral. */
  icon?: string;
  items: CatalogItem[];
}

// RNF-43: o catálogo é derivado do mapa de rotas (`routes.ts`). Nomes em pt-BR.json: menu.groups.<id> e menu.items.<id>.
export const menuCatalog: CatalogGroup[] = menuGroups.map((g) => ({
  id: g.id,
  icon: g.icon,
  items: routes
    .filter((r) => r.item?.group === g.id && r.permission)
    .map((r) => ({
      id: r.id,
      permission: r.permission as Permission,
      href: generatePath(r.path),
      icon: r.item!.icon,
      available: !r.item!.state,
      ...(r.item!.state === "soon" ? { soon: true } : {}),
      ...(r.item!.soonFor ? { soonFor: r.item!.soonFor } : {}),
    })),
}));
