import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { useListTo } from "@/components/query/useListTo";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ModalityDot } from "@/components/ui/modality-dot";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  activatePlan,
  usePlanDetail,
  type PlanDetail,

} from "./usePlans";

// RN-PLA-06: consulta do plano desativado (só leitura) com quem desativou e o histórico de valor; "Reativar plano" é a única ação.
export function PlanInspectDrawer({
  id,
  showOtherUnits,
  onClose,
  onDone,
}: {
  id: string;
  showOtherUnits: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const loaded = usePlanDetail(id);
  const plan = loaded.detail;
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const k = "plans.inspect.";
  const frequency = !plan ? "" : plan.weeklyFrequency === null ? t("plans.table.free") : t("plans.table.perWeek", { count: plan.weeklyFrequency });

  async function reactivate() {
    setError(undefined);
    setBusy(true);
    try {
      await activatePlan(id);
    } catch (e) {
      setBusy(false);
      setError(
        t(
          e instanceof ApiError && e.status === 409
            ? "plans.actions.activateConflict"
            : "plans.actions.failed",
        ),
      );
      return;
    }
    setBusy(false);
    onClose();
    onDone();
  }

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={plan?.name ?? t(`${k}title`)}
      eyebrow={plan && <ModalityDot name={plan.modality.name} />}
      badge={<StatusBadge status="INACTIVE" label={t(`${k}badge`)} />}
      subtitle={
        plan && (
          <p className="text-sm text-muted-foreground">
            {t(`${k}subtitle`, {
              unit: plan.unit.name,
              value: formatMoney(plan.valueCents),
              frequency,
            })}
          </p>
        )
      }
      footer={
        <Button
          type="button"
          className="min-h-11"
          disabled={busy || loaded.status !== "ready"}
          onClick={() => void reactivate()}
        >
          {t(`${k}reactivate`)}
        </Button>
      }
    >
      <div className="flex flex-col gap-5" aria-busy={busy}>
        <p className="flex items-start gap-3 rounded-md border bg-surface-soft px-4 py-3 text-sm">
          <Lock
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          {t(`${k}notice`)}
        </p>
        {loaded.status === "loading" && <LoadingState />}
        {loaded.status === "forbidden" && <ForbiddenState />}
        {loaded.status === "error" && <ErrorState onRetry={loaded.retry} />}
        {loaded.detail && (
          <Detail detail={loaded.detail} showOtherUnits={showOtherUnits} />
        )}
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
    </Drawer>
  );
}

function Detail({
  detail,
  showOtherUnits,
}: {
  detail: PlanDetail;
  showOtherUnits: boolean;
}) {
  const { t } = useTranslation();
  const k = "plans.inspect.";
  const off = detail.deactivation;
  return (
    <>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t(`${k}students`)}</dt>
          <dd>{detail.studentsUsing}</dd>
        </div>
        {off && (
          <div>
            <dt className="sr-only">{t(`${k}deactivatedLabel`)}</dt>
            <dd className="mt-4">
              {off.by
                ? t(`${k}deactivated`, {
                    date: formatDate(off.at),
                    person: off.by,
                  })
                : t(`${k}deactivatedNoPerson`, { date: formatDate(off.at) })}
            </dd>
          </div>
        )}
        {showOtherUnits && (
          <div>
            <dt className="text-xs text-muted-foreground">
              {t(`${k}otherUnits`)}
            </dt>
            <dd>{t(detail.validOtherUnits ? `${k}yes` : `${k}no`)}</dd>
          </div>
        )}
      </dl>
      <section
        aria-labelledby="plan-history-title"
        className="flex flex-col gap-2"
      >
        <h3 id="plan-history-title" className="font-medium">
          {t(`${k}history`)}
        </h3>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2">
                  {t(`${k}since`)}
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  {t(`${k}value`)}
                </th>
                <th scope="col" className="px-3 py-2">
                  {t(`${k}changedBy`)}
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.valueHistory.map((h) => (
                <tr
                  key={`${h.startsOn}-${h.valueCents}`}
                  className="border-t border-divider"
                >
                  <td className="px-3 py-2">{formatDate(h.startsOn)}</td>
                  <td className="px-3 py-2 text-right">
                    {formatMoney(h.valueCents)}
                  </td>
                  <td className="px-3 py-2">
                    {h.changedBy ?? t(`${k}noAuthor`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// O que a lista de planos passa ao painel (rota-filha): recarregar a lista e a política de outras unidades.
export interface PlansOutlet {
  reload: () => void;
  showOtherUnits: boolean;
}

// RN-PLA-06: a consulta do plano desativado como rota-filha de /planos; fechar volta à lista com os filtros.
export function PlanPanelPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const list = useListTo("/planos");
  const ctx = useOutletContext<PlansOutlet | null>();
  return <PlanInspectDrawer id={id} showOtherUnits={ctx?.showOtherUnits ?? false} onClose={() => void navigate(list)} onDone={ctx?.reload ?? (() => undefined)} />;
}
