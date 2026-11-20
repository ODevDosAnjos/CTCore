import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { PortalAutoDebitCard } from "./PortalAutoDebitCard";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PortalChargeHistory } from "./PortalChargeHistory";
import { PortalHeading } from "./PortalHeading";
import { PortalReceiptsCard } from "./PortalReceiptsCard";
import { PortalLayout } from "./PortalLayout";
import { PortalOpenCharges } from "./PortalOpenCharges";
import { usePortalFinance, type PortalFinanceData } from "./usePortalFinance";

const FAMILY = "FAMILY";

// RF-POR-05: Financeiro do aluno em `?aluno=`, `?visao=familia` e `?ano=` (padrão: primeiro cartão, só ele, ano de hoje). Abre também no portal reduzido (RN-POR-08).
export function PortalFinancePage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const student = params.get("aluno");
  const family = params.get("visao") === "familia";
  const year = params.get("ano");
  const { status, data, reload } = usePortalFinance(student, family ? FAMILY : "STUDENT", year);
  // Os controles ficam na tela enquanto a leitura nova carrega.
  const [last, setLast] = useState<PortalFinanceData>();
  if (data && data !== last) setLast(data);
  const shown = data ?? last;

  const change = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  const choose = (value: string) => (value === FAMILY ? change({ visao: "familia", ano: null }) : change({ aluno: value, visao: null, ano: null }));

  return (
    <PortalLayout>
      <PortalHeading
        className="mb-4"
        label={t("portalFinance.label")}
        title={t("portalShell.tabs.finance")}
        subtitle={shown && family ? t("portalFinance.familyTotal", { value: formatCurrency(shown.familyOpenCents) }) : undefined}
      />
      {shown && shown.students.length > 1 && (
        <div role="group" aria-label={t("portalFinance.student")} className="mb-4 flex flex-wrap gap-2">
          {[...shown.students.map((s) => ({ id: s.id, name: s.name, label: s.self ? t("portalFinance.you") : s.name })), { id: FAMILY, name: "", label: t("portalFinance.family") }].map((c) => {
            const on = c.id === (family ? FAMILY : (student ?? shown.selectedStudentId ?? ""));
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => choose(c.id)}
                className={cn(
                  "relative inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm after:absolute after:left-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "border-primary bg-primary/10 font-medium" : "border-input bg-card hover:bg-surface-soft",
                )}
              >
                {c.name && <Avatar name={c.name} decorative size="sm" className="size-6 text-[10px]" />}
                {c.label}
              </button>
            );
          })}
        </div>
      )}
      {status === "loading" || status === "idle" ? (
        <LoadingState variant="card" text={t("portalFinance.states.loading")} />
      ) : status === "forbidden" ? (
        <ForbiddenState variant="card" title={t("portalFinance.states.forbiddenTitle")} text={t("portalFinance.states.forbiddenText")} action={<Button asChild variant="outline"><Link to="/">{t("portalFinance.states.backHome")}</Link></Button>} />
      ) : status === "ready" && data ? (
        <div className="flex flex-col gap-4">
          <PortalOpenCharges items={data.open} showStudent={family} onChanged={reload} />
          <div className="grid gap-4 md:grid-cols-2">
            <PortalAutoDebitCard />
            <PortalReceiptsCard />
          </div>
          {!family && <PortalChargeHistory items={data.history} year={data.year} years={data.years} onYear={(y) => change({ ano: String(y) })} />}
        </div>
      ) : (
        <ErrorState variant="card" title={t("portalFinance.states.errorTitle")} onRetry={reload} />
      )}
    </PortalLayout>
  );
}
