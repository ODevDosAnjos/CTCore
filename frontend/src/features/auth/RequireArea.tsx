import type { ReactNode } from "react";
import { useOptionalPermissions } from "@/features/permissions/usePermissions";
import { canAccess, type AppRoute } from "@/routes";
import { AreaUnavailablePage } from "./AreaUnavailablePage";
import { useSession } from "./SessionProvider";

// Guarda de uma rota do mapa (`routes.ts`): a mesma regra do menu (D1). Nega sem redirecionar (D1 da #8); sem vínculo ativo também nega (CA4).
// A moldura da gestão já leu as permissões (R2); aqui só se lê o contexto.
export function RequireArea({ route, children }: { route: AppRoute; children: ReactNode }) {
  const { state } = useSession();
  const permissions = useOptionalPermissions()?.permissions;
  if (state.status !== "ready") return null;
  const { links, activeLinkId } = state.session;
  const role = links.find((l) => l.id === activeLinkId)?.role;
  return canAccess(route, role, permissions) ? children : <AreaUnavailablePage />;
}
