import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ApiError } from "@/lib/api";
import { hrefOf } from "@/routes";
import { Banner } from "@/components/ui/banner";
import { BlockedNotice } from "@/components/ui/blocked-notice";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { useUnitModalities } from "./useUnitModalities";

type Failure = { name: string; classes: { name: string; students: number }[] };

// A recusa 409 manda, por turma, "class" (nome) seguido de "classStudents" (alunos ativos).
function refusedClasses(err: unknown): Failure["classes"] {
  if (!(err instanceof ApiError) || err.code !== "UNIT_MODALITY_IN_USE") return [];
  const classes: Failure["classes"] = [];
  for (const f of err.fields) {
    if (f.field === "class") classes.push({ name: f.message, students: 0 });
    else if (f.field === "classStudents" && classes.length > 0) classes[classes.length - 1].students = Number(f.message) || 0;
  }
  return classes;
}

// RF-MOD-03: modalidades que a unidade oferece. Cada caixa grava na hora, fora do formulário e do "Salvar" da tela.
export function UnitModalitiesSection({ unitId, unitName }: { unitId: string; unitName: string }) {
  const { t } = useTranslation();
  const api = useUnitModalities(unitId);
  const [failed, setFailed] = useState<Failure>();

  function body() {
    if (api.status === "loading") return <LoadingState />;
    if (api.status === "forbidden") return <ForbiddenState />;
    if (!api.listing) return <ErrorState onRetry={api.retry} />;
    const { canManage, items } = api.listing;
    if (items.length === 0) {
      return (
        <EmptyState
          title={t("unitModalities.emptyTitle")}
          text={t("unitModalities.emptyText")}
          action={
            <Link className="min-h-11 py-2 underline" to={`${hrefOf("organizationSettings")}?aba=modalidades`}>
              {t("unitModalities.emptyLink")}
            </Link>
          }
        />
      );
    }
    return (
      <>
        <ul className="flex flex-col">
          {items.map((m) => (
            <li key={m.id} className="flex items-start gap-3 py-1.5">
              <Checkbox
                id={`unit-modality-${m.id}`}
                className="mt-[3px]"
                aria-describedby={`unit-modality-${m.id}-help`}
                checked={m.offered}
                disabled={!canManage}
                onChange={(e) => {
                  setFailed(undefined);
                  api.setOffered(m.id, e.target.checked).catch((err) => setFailed({ name: m.name, classes: refusedClasses(err) }));
                }}
              />
              <div className="min-w-0">
                <label htmlFor={`unit-modality-${m.id}`} className="block break-words text-sm">
                  {m.name}
                </label>
                <p id={`unit-modality-${m.id}-help`} className="text-sm text-muted-foreground">
                  {t(m.graduationEnabled ? "unitModalities.graduationOn" : "unitModalities.graduationOff")}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {failed &&
          (failed.classes.length > 0 ? (
            <BlockedNotice
              className="mt-3"
              title={t("unitModalities.inUseTitle", { name: failed.name, unit: unitName })}
              lines={failed.classes.map((c) => t("unitModalities.inUseClass", { name: c.name, students: t(c.students === 1 ? "unitModalities.studentOne" : "unitModalities.studentMany", { count: c.students }) }))}
            >
              <p className="text-muted-foreground">{t("unitModalities.inUseGuidance")}</p>
            </BlockedNotice>
          ) : (
            <Banner tone="danger" className="mt-3">
              {t("unitModalities.changeError", { name: failed.name })}
            </Banner>
          ))}
        {!canManage && <p className="mt-2 text-sm text-muted-foreground">{t("unitModalities.readOnly")}</p>}
      </>
    );
  }

  return (
    <Card heading="h2" title={t("unitModalities.title", { unit: unitName })}>
      {body()}
    </Card>
  );
}
