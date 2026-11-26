import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { useBelowSm } from "@/components/query/useBelowSm";
import { SupportLink } from "@/features/auth/SupportContact";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatCurrency } from "@/lib/format";
import { todayIso } from "./ChangeDueDialog";
import { longDate, methodRows, registrarRows, shiftDay, type MethodRow, type RegistrarRow } from "./receiptRows";
import type { DailyReceipts } from "./types";
import { useDailyReceipts } from "./useDailyReceipts";

const cell = "px-3 py-3 text-left align-middle";
const num = `${cell} text-right tabular-nums`;

const TOTAL_KEY = "total";

type Col = { label: string; numeric?: boolean };

// Tabela no desktop; no celular, um cartão por linha com as mesmas informações (D10).
function Block<R>({ title, cols, rows, total, narrow, cells, name }: { title: string; cols: Col[]; rows: R[]; total?: ReactNode[]; narrow: boolean; cells: (r: R) => ReactNode[]; name: (r: R) => string }) {
  const card = (values: ReactNode[], key: string, strong?: boolean) => (
    <li key={key} className={strong ? "rounded-md bg-surface-soft p-3 text-sm font-semibold" : "rounded-md border p-3 text-sm"}>
      <p className="font-medium">{values[0]}</p>
      <dl className="mt-1 flex flex-col gap-0.5">
        {cols.slice(1).map((c, i) => (
          <div key={c.label} className="flex justify-between gap-3">
            <dt className="font-normal text-muted-foreground">{c.label}</dt>
            <dd className="tabular-nums">{values[i + 1]}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-2xl font-semibold uppercase">{title}</h2>
      {narrow ? (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => card(cells(r), name(r)))}
          {total && card(total, TOTAL_KEY, true)}
        </ul>
      ) : (
        <table className="w-full overflow-hidden rounded-card border bg-card text-sm">
          <thead className="bg-surface-soft text-xs text-muted-foreground">
            <tr>
              {cols.map((c) => (
                <th key={c.label} scope="col" className={`${c.numeric ? "text-right" : "text-left"} px-3 py-3 font-semibold`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={name(r)}>
                {cells(r).map((v, i) => (
                  <td key={cols[i].label} className={cols[i].numeric ? num : cell}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {total && (
            <tfoot>
              <tr className="border-t bg-surface-soft font-semibold">
                {total.map((v, i) => (
                  <td key={cols[i].label} className={cols[i].numeric ? num : cell}>
                    {v}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </section>
  );
}

function Summary({ data }: { data: DailyReceipts }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const { rows, total } = methodRows(data.byMethod);
  const money = (c: number) => (c === 0 ? "—" : formatCurrency(c));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Block<MethodRow>
        title={t("charges.daily.byMethod")}
        cols={[{ label: t("charges.daily.columns.method") }, { label: t("charges.daily.columns.count"), numeric: true }, { label: t("charges.daily.columns.amount"), numeric: true }, { label: t("charges.daily.columns.fee"), numeric: true }]}
        rows={rows}
        narrow={narrow}
        name={(r) => r.key}
        cells={(r) => [t(`charges.daily.method.${r.key}`), r.count, formatCurrency(r.totalCents), money(r.feeCents)]}
        total={[t("charges.daily.totalRow"), total.count, formatCurrency(total.totalCents), money(total.feeCents)]}
      />
      <Block<RegistrarRow>
        title={t("charges.daily.byRegistrar")}
        cols={[{ label: t("charges.daily.columns.registrar") }, { label: t("charges.daily.columns.count"), numeric: true }, { label: t("charges.daily.columns.amount"), numeric: true }]}
        rows={registrarRows(data.byRegistrar)}
        narrow={narrow}
        name={(r) => r.id ?? "portal"}
        cells={(r) => [r.name ?? t("charges.daily.portal"), r.count, r.count === 0 ? "—" : formatCurrency(r.totalCents)]}
      />
    </div>
  );
}

function Content() {
  const { t } = useTranslation();
  const scope = useUnitScope();
  const [date, setDate] = useState(todayIso);
  const [picked, setPicked] = useState("");
  // Com "todas as unidades" a rota não tem o que consultar; a pessoa escolhe uma da lista ao alcance.
  const all = scope.selected === ALL;
  const unitId = all ? picked || null : scope.selected;
  const { status, data, reload } = useDailyReceipts(unitId, date);
  const today = todayIso();

  let body;
  if (!unitId) body = <EmptyState variant="card" title={t("charges.daily.pickUnit")} text={t("charges.daily.pickUnitText")} />;
  else if (status === "loading" || status === "idle") body = <LoadingState variant="card" />;
  else if (status === "forbidden") body = <ForbiddenState variant="card" />;
  else if (status === "error" || status === "notFound" || !data) body = <ErrorState variant="card" onRetry={reload} secondary={<SupportLink />} />;
  else if (data.count === 0) body = <EmptyState variant="card" title={t("charges.daily.empty")} text={t("charges.daily.emptyText")} />;
  else body = <Summary data={data} />;

  const when = longDate(date);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("charges.daily.title")}
        subtitle={t("charges.daily.subtitle", { date: when })}
        actions={
          <>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setDate(shiftDay(date, -1))}>
              {t("charges.daily.previous")}
            </Button>
            {date !== today && (
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setDate(shiftDay(date, 1))}>
                {t("charges.daily.next")}
              </Button>
            )}
            <ComingSoon variant="button" label={t("charges.export")} />
          </>
        }
      />
      {all && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("charges.daily.unit")}
          <Select className="w-auto" value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">{t("charges.daily.chooseUnit")}</option>
            {scope.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      {body}
    </div>
  );
}

// RF-COB-08: recebimentos do dia da unidade, sem caixa (RN-COB-12); a barreira de dados é o servidor.
export function DailyReceiptsPage() {
  return <Content />;
}
