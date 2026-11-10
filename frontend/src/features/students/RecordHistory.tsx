import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CanvasPagination } from "@/components/query/Pagination";
import { DataTable, type Column } from "@/components/query/DataTable";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PillFilter } from "@/components/ui/pill-filter";
import { formatDateTime } from "@/lib/format";
import type { StudentHistoryEntry } from "./types";
import { useStudentHistory } from "./useStudentRecord";

const FINANCIAL_PREFIXES = ["charge.", "payment.", "reminder."];
// D5: a Área vem do prefixo do código da ação; o que não é de cobrança (ou é desconhecido) é "Alunos".
export const historyArea = (action: string) => (FINANCIAL_PREFIXES.some((p) => action.startsWith(p)) ? "FINANCIAL" : "STUDENTS");
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// RF-ALU-03: auditoria do aluno em texto, da mais recente para a mais antiga; sem valores antes e depois (D6).
// Filtros e paginação ficam aqui, sobre as 100 entradas mais recentes (D5).
export function RecordHistory({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const k = "students.record.history.";
  const [area, setArea] = useState("");
  const [period, setPeriod] = useState("12m");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const { status, data, reload } = useStudentHistory(id);
  if (status === "loading") return <LoadingState />;
  if (status === "forbidden") return <ForbiddenState />;
  if (status === "error" || status === "notFound" || !data) return <ErrorState onRetry={reload} />;
  if (data.total === 0) return <EmptyState text={t(`${k}empty`)} />;
  // O código da ação tem ponto; a chave usa sublinhado. Ação desconhecida mostra o código.
  const label = (action: string) => {
    const key = `${k}actions.${action.replaceAll(".", "_")}`;
    return i18n.exists(key) ? t(key) : action;
  };
  const profile = (p: string | null) => (p && i18n.exists(`chooseLink.roles.${p}`) ? t(`chooseLink.roles.${p}`) : p);
  const who = (e: StudentHistoryEntry) => (e.actor ? [e.actor, profile(e.actorProfile)].filter(Boolean).join(" · ") : t(`${k}system`));
  const since = new Date().getTime() - YEAR_MS;
  const rows = data.items.filter((e) => (!area || historyArea(e.action) === area) && (period !== "12m" || new Date(e.at).getTime() >= since));
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const shown = rows.slice((Math.min(page, pages) - 1) * size, Math.min(page, pages) * size);
  const columns: Column<StudentHistoryEntry>[] = [
    { key: "at", label: t(`${k}columns.at`), render: (e) => <span className="whitespace-nowrap tabular-nums">{formatDateTime(e.at)}</span> },
    { key: "who", label: t(`${k}columns.who`), render: who },
    {
      key: "what",
      label: t(`${k}columns.what`),
      render: (e) => (
        <>
          <span className="break-words">{label(e.action)}</span>
          {e.reason && <span className="block break-words text-xs text-muted-foreground">{t(`${k}reason`, { reason: e.reason })}</span>}
        </>
      ),
    },
    { key: "area", label: t(`${k}columns.area`), render: (e) => t(`${k}areas.${historyArea(e.action)}`) },
  ];
  const change = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(1);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <PillFilter
          label={t(`${k}area`)}
          value={area}
          onChange={change(setArea)}
          allLabel={t(`${k}all`)}
          options={(["FINANCIAL", "STUDENTS"] as const).map((a) => ({ id: a, name: t(`${k}areas.${a}`) }))}
        />
        <PillFilter
          label={t(`${k}period`)}
          value={period === "12m" ? "" : period}
          onChange={change((v) => setPeriod(v || "12m"))}
          allLabel={t(`${k}last12`)}
          options={[{ id: "all", name: t(`${k}allTime`) }]}
        />
        <span className="ml-auto">
          <ComingSoon variant="link" label={t(`${k}audit`)} />
        </span>
      </div>
      {rows.length === 0 ? (
        <EmptyState text={t(`${k}noResult`)} />
      ) : (
        <>
          <DataTable columns={columns} rows={shown} rowKey={(e) => `${e.at}-${e.action}`} order="" onOrder={() => {}} />
          <CanvasPagination page={Math.min(page, pages)} pages={pages} total={rows.length} size={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} />
        </>
      )}
    </div>
  );
}
