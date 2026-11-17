import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ApiError } from "@/lib/api";
import { Banner } from "@/components/ui/banner";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { useUnitModalities } from "./useUnitModalities";

// RF-MOD-03: modalidades que a unidade oferece. Cada interruptor grava na hora, fora do formulário e do "Salvar" da tela.
export function UnitModalitiesSection({ unitId }: { unitId: string }) {
  const { t } = useTranslation();
  const api = useUnitModalities(unitId);
  const [failed, setFailed] = useState<{ name: string; classes: string[] }>();

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
            <Link className="min-h-11 py-2 underline" to="/configuracoes/modalidades">
              {t("unitModalities.emptyLink")}
            </Link>
          }
        />
      );
    }
    return (
      <>
        {failed && (
          <Banner tone="danger" className="mb-2">
            <p>{t(failed.classes.length > 0 ? "unitModalities.inUse" : "unitModalities.changeError", { name: failed.name })}</p>
            {failed.classes.length > 0 && (
              <ul className="list-disc pl-5">
                {failed.classes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </Banner>
        )}
        <ul className="flex flex-col">
          {items.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t(m.classCount === 1 ? "unitModalities.classOne" : "unitModalities.classMany", { count: m.classCount })} · {t(m.planCount === 1 ? "unitModalities.planOne" : "unitModalities.planMany", { count: m.planCount })}
                </p>
              </div>
              <Switch
                label={m.name}
                checked={m.offered}
                disabled={!canManage}
                onCheckedChange={(offered) => {
                  setFailed(undefined);
                  api.setOffered(m.id, offered).catch((err) =>
                    setFailed({
                      name: m.name,
                      classes: err instanceof ApiError && err.code === "UNIT_MODALITY_IN_USE" ? err.fields.filter((f) => f.field === "class").map((f) => f.message) : [],
                    }),
                  );
                }}
              />
            </li>
          ))}
        </ul>
        {!canManage && <p className="mt-2 text-sm text-muted-foreground">{t("unitModalities.readOnly")}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{t("unitModalities.note")}</p>
      </>
    );
  }

  return (
    <Card heading="h2" title={t("unitModalities.title")}>
      {body()}
    </Card>
  );
}
