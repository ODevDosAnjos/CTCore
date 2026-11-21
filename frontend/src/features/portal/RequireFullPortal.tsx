import { Navigate, Outlet } from "react-router";
import { usePortalShell } from "./usePortalShell";

// R4/CA9: Agenda e Avisos não existem no portal reduzido; abrir pelo endereço leva ao Financeiro. A barreira dos dados é do servidor (PortalShell.reduced).
// A moldura já leu o portal (só mostra a área central depois), então aqui não há leitura própria.
export function RequireFullPortal() {
  const shell = usePortalShell();
  return shell.data?.reduced ? <Navigate to="/portal/financeiro" replace /> : <Outlet />;
}
