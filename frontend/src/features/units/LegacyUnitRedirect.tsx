import { Navigate, useLocation } from "react-router";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { hrefOf } from "@/routes";
import { ALL, useUnitScope } from "./UnitScopeProvider";

// Endereços sem unidade (item 746, D7): ela vem de `?unidade=` ou do seletor do topo. Sem nenhuma, a configuração vai para a lista,
// para ninguém alterar a unidade errada; a tabela de permissões é igual em todas e usa a primeira ao alcance.
export function LegacyUnitRedirect({ to }: { to: "unitSettings" | "permissionsTable" }) {
  const scope = useUnitScope();
  const params = new URLSearchParams(useLocation().search);
  if (scope.status === "loading") return <LoadingState />;
  if (scope.status === "forbidden") return <ForbiddenState />;
  if (scope.status === "error") return <ErrorState onRetry={scope.retry} />;
  const id =
    params.get("unidade") || (scope.selected !== ALL ? scope.selected : null) || (to === "permissionsTable" ? scope.units[0]?.id : undefined);
  params.delete("unidade");
  if (!id) return <Navigate to={hrefOf("units")} replace />;
  return <Navigate to={{ pathname: hrefOf(to, { id }), search: params.toString() }} replace />;
}
