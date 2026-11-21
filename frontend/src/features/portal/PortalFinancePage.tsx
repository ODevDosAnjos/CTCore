import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { PortalAutoDebitCard } from "./PortalAutoDebitCard";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession } from "@/features/auth/SessionProvider";
import { useBelowSm } from "@/components/query/useBelowSm";
import { PortalContactCard } from "./PortalContactCard";
import { usePortalShell } from "./usePortalShell";
import { PortalChargeCard } from "./PortalChargeCard";
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
  const shell = usePortalShell();
  const { state } = useSession();
  const narrow = useBelowSm();
  const firstName = (state.status === "ready" ? state.session.account.name : null)?.trim().split(" ")[0];
  // Os controles ficam na tela enquanto a leitura nova carrega.
  const [last, setLast] = useState<PortalFinanceData>();
  if (data && data !== last) setLast(data);
  const shown = data ?? last;
  // RN-POR-08: sem modalidade ativa o Financeiro é a tela inicial, com o contato da unidade e sem débito automático nem recibos por e-mail.
  const reduced = shown?.reduced ?? false;

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
        label={reduced ? (shell.data?.unit ? t("portalFinance.reduced.label", { unit: shell.data.unit.name }) : undefined) : t("portalFinance.label")}
        title={reduced ? t("portalFinance.reduced.greeting", { name: firstName ?? "" }) : t("portalShell.tabs.finance")}
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
          {reduced ? (
            <div className="grid items-start gap-4 md:grid-cols-2">
              <PortalChargeCard items={data.open} nextDueOn={null} onChanged={reload} />
              <PortalContactCard unit={shell.data?.unit} />
            </div>
          ) : (
            <PortalOpenCharges items={data.open} showStudent={family} onChanged={reload} />
          )}
          {!reduced && (
            <div className="grid gap-4 md:grid-cols-2">
              <PortalAutoDebitCard />
              <PortalReceiptsCard />
            </div>
          )}
          {!family && <PortalChargeHistory reduced={reduced} items={data.history} year={data.year} years={data.years} onYear={(y) => change({ ano: String(y) })} />}
          {reduced && (
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm text-muted-foreground">{t(narrow ? "portalFinance.reduced.noteShort" : "portalFinance.reduced.note")}</p>
              <Link to={`/portal/carteirinha${data.selectedStudentId ? `?aluno=${data.selectedStudentId}` : ""}`} className="inline-flex min-h-11 items-center text-sm underline">
                {t("portalCard.link")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ErrorState variant="card" title={t("portalFinance.states.errorTitle")} onRetry={reload} />
      )}
    </PortalLayout>
  );
}
