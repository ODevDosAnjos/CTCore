import type { ReactNode } from "react";
import { PermissionsContext, useLoadPermissions } from "@/features/permissions/usePermissions";

/** Provedor de teste: lê GET /permissions (MSW) e o entrega como a moldura da gestão faz, para renderizar uma tela sem o roteador do App. */
export function PermissionsFrame({ children }: { children: ReactNode }) {
  const value = useLoadPermissions();
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
