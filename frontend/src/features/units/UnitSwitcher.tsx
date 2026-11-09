import { useTranslation } from "react-i18next";
import { UnitMenu, type UnitMenuProps } from "@/components/layout/UnitMenu";
import { useUnitScope } from "./UnitScopeProvider";

// RF-ORG-05: seletor da barra superior (RN-ORG-04), também com uma só unidade (rótulo sem lista). O servidor segue decidindo cada acesso.
export function UnitSwitcher({ variant }: { variant?: UnitMenuProps["variant"] }) {
  const scope = useUnitScope();
  return <UnitMenu status={scope.status} units={scope.units} allUnits={scope.allUnits} selected={scope.selected} onSelect={scope.select} onRetry={scope.retry} variant={variant} />;
}

// Abrangência escolhida, em uma linha, para o Início (sem dados somados: esses vêm nas próximas sprints).
export function ScopeLine() {
  const { t } = useTranslation();
  const scope = useUnitScope();
  if (scope.status !== "ready" || scope.selected === null) return null;
  const unit = scope.units.find((u) => u.id === scope.selected);
  return <p className="mt-2 text-sm text-muted-foreground">{unit ? t("unitScope.scopeOne", { name: unit.name }) : t("unitScope.scopeAll")}</p>;
}
