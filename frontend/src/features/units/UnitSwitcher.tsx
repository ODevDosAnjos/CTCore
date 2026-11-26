import { UnitMenu, type UnitMenuProps } from "@/components/layout/UnitMenu";
import { useUnitScope } from "./UnitScopeProvider";

// RF-ORG-05: seletor da barra superior (RN-ORG-04), também com uma só unidade (rótulo sem lista). O servidor segue decidindo cada acesso.
export function UnitSwitcher({ variant }: { variant?: UnitMenuProps["variant"] }) {
  const scope = useUnitScope();
  return <UnitMenu status={scope.status} units={scope.units} allUnits={scope.allUnits} selected={scope.selected} onSelect={scope.select} onRetry={scope.retry} variant={variant} />;
}
