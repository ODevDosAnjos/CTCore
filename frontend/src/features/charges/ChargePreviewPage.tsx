import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { SupportLink } from "@/features/auth/SupportContact";
import { usePermissions } from "@/features/permissions/usePermissions";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatCurrency } from "@/lib/format";
import { AdvanceChargesDialog } from "./AdvanceChargesDialog";
import { todayIso } from "./ChangeDueDialog";
import { ChargePreviewRows, useSigned } from "./ChargePreviewRows";
import { PERIODS, useChargePreview } from "./useChargePreview";

// D7: a tela abre com um mês de vencimentos (o servidor segue com 10 quando `days` não vem).
const DEFAULT_DAYS = 30;

const monthName = (iso: string) => new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 7)}-15T12:00:00Z`));
const previousMonthName = (iso: string) => monthName(new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 2, 15)).toISOString());

function Content() {
  const { t } = useTranslation();
  const scope = useUnitScope();
  const signed = useSigned();
  const { permissions } = usePermissions();
  const [days, setDays] = useState<number>(DEFAULT_DAYS);
  const [picked, setPicked] = useState("");
  const [advancing, setAdvancing] = useState(false);
  // R10: com "todas as unidades" a rota não tem o que consultar; a pessoa escolhe uma da lista ao alcance.
  const all = scope.selected === ALL;
  const unitId = all ? picked || null : scope.selected;
  const { status, data, reload } = useChargePreview(unitId, days);
  const full = permissions?.COLLECTIONS === "FULL";

  // O mês da tela é o do primeiro vencimento previsto; sem vencimentos, o de hoje.
  const reference = data?.days[0]?.dueOn ?? todayIso();
  const previous = previousMonthName(reference);

  let body;
  if (!unitId) body = <EmptyState variant="card" title={t("charges.preview.pickUnit")} text={t("charges.preview.pickUnitText")} />;
  else if (status === "loading" || status === "idle") body = <LoadingState variant="card" />;
  else if (status === "forbidden") body = <ForbiddenState variant="card" />;
  else if (status === "error" || status === "notFound" || !data) body = <ErrorState variant="card" onRetry={reload} secondary={<SupportLink />} />;
  else if (data.count === 0 && data.skipped.length === 0) body = <EmptyState variant="card" title={t("charges.preview.empty", { days })} text={t("charges.preview.emptyText")} />;
  else {
    const diff = data.totalCents - data.previousMonthTotalCents;
    body = (
      <>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label={t("charges.preview.total")}
            value={formatCurrency(data.totalCents)}
            note={diff === 0 ? t("charges.preview.sameAs", { month: previous }) : t("charges.preview.diffNote", { diff: signed(diff), month: previous })}
            tone={diff > 0 ? "ok" : diff < 0 ? "warn" : "neutral"}
          />
          <Stat
            label={t("charges.preview.count")}
            value={data.count}
            note={data.skipped.length > 0 ? t("charges.preview.skippedNote", { count: data.skipped.length }) : t("charges.preview.allCharged")}
            tone={data.skipped.length > 0 ? "warn" : "neutral"}
          />
          <Stat label={t("charges.preview.generated")} value={formatCurrency(data.alreadyGeneratedCents)} note={t("charges.preview.generatedNote")} />
        </div>
        <ChargePreviewRows data={data} canAdjust={full} previousMonth={previous} onChanged={reload} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("charges.preview.title")}
        actions={
          <>
            <label className="flex items-center gap-2 text-sm font-medium">
              {t("charges.preview.period")}
              <Select className="w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {PERIODS.map((d) => (
                  <option key={d} value={d}>
                    {t("charges.preview.periodOption", { count: d })}
                  </option>
                ))}
              </Select>
            </label>
            {full && (
              <Button type="button" className="min-h-11" onClick={() => setAdvancing(true)}>
                {t("charges.advance.open")}
              </Button>
            )}
          </>
        }
      />
      {all && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("charges.preview.unit")}
          <Select className="w-auto" value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">{t("charges.preview.chooseUnit")}</option>
            {scope.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      {body}
      {advancing && <AdvanceChargesDialog onClose={() => setAdvancing(false)} onDone={reload} />}
    </div>
  );
}

// RF-COB-03: prévia da geração de mensalidades com ajustes antes de gerar (RN-COB-02); a barreira de dados e de ações é o servidor.
export function ChargePreviewPage() {
  return <Content />;
}
