import { Outlet } from "react-router";
import { ManagementShell } from "@/features/permissions/ManagementShell";
import { PortalShell } from "@/features/portal/PortalShell";
import { RequirePortalTerm } from "@/features/portal/RequirePortalTerm";
import { isManagement } from "@/routes";
import { useSession } from "./SessionProvider";

// RNF-43: a moldura é escolhida pelo perfil do vínculo ativo e montada uma vez; `key` do vínculo a refaz ao trocar de organização ou de perfil (R8).
// No portal, o termo pendente leva ao aceite antes da moldura (RN-POR-03); sem vínculo ativo, só a rota.
export function RoleShell() {
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const link = session?.links.find((l) => l.id === session.activeLinkId);
  if (!link) return <Outlet />;
  if (isManagement(link.role))
    return <ManagementShell key={link.id} />;
  return (
    <RequirePortalTerm key={link.id}>
      <PortalShell />
    </RequirePortalTerm>
  );
}
