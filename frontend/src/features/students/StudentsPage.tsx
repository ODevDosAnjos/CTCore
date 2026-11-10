import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Columns3 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import type { TFunction } from "i18next";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { QueryPage } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { useSession } from "@/features/auth/SessionProvider";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { formatDate } from "@/lib/format";
import type { StudentRow } from "./types";
import { NewEnrollmentLink } from "./NewEnrollmentLink";
import { StudentFilters } from "./StudentFilters";
import { StudentRecordPanel } from "./StudentRecordPanel";
import { OPTIONAL_COLUMNS, useStudentColumns, type OptionalColumn } from "./useStudentColumns";
import { fetchStudents } from "./useStudents";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PersonAvatar, PersonRow } from "@/components/ui/person-row";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalityDot } from "@/components/ui/modality-dot";
import { Popover } from "@/components/ui/popover";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { PageHeader } from "@/components/ui/page-header";

// O nome abre a ficha em painel (RF-ALU-03), mantendo a busca e os filtros da lista na mesma página.
const allColumns = (t: TFunction, search: string): Record<"name" | OptionalColumn, Column<StudentRow>> => ({
  name: {
    key: "name",
    label: t("students.columns.name"),
    render: (r) => (
      <PersonRow
        name={r.name}
        photoUrl={r.photoUrl}
        title={
          <Link to={`/alunos/${r.id}${search}`} aria-label={t("students.record.open", { name: r.name })} className="inline-flex min-h-11 min-w-0 items-center break-words font-medium underline-offset-2 hover:underline">
            {r.name}
          </Link>
        }
        badges={r.seals.map((seal) => (
          <StatusBadge key={seal} status={seal} label={t(`students.seals.${seal}`)} />
        ))}
        secondary={t("students.rowSecondary", { age: r.age, unit: r.registeredUnit.name })}
      />
    ),
  },
  unit: { key: "unit", label: t("students.columns.unit"), render: (r) => r.registeredUnit.name },
  age: { key: "age", label: t("students.columns.age"), render: (r) => t("students.age", { count: r.age }) },
  ageRange: { key: "ageRange", label: t("students.columns.ageRange"), render: (r) => r.ageRange?.name ?? t("format.empty") },
  createdAt: { key: "createdAt", label: t("students.columns.createdAt"), render: (r) => formatDate(r.createdAt) },
  modalities: {
    key: "modalities",
    label: t("students.columns.modalities"),
    render: (r) =>
      r.modalities.length === 0 ? (
        t("format.empty")
      ) : (
        <ul className="flex flex-col gap-1">
          {r.modalities.map((m) => (
            <li key={m.id} className="break-words">
              <ModalityDot name={m.modality.name} className="font-medium" />
              <span className="block text-xs text-muted-foreground">{m.level ? t("students.classLevel", { class: m.primaryClass.name, level: m.level.name }) : m.primaryClass.name}</span>
            </li>
          ))}
        </ul>
      ),
  },
  graduation: { key: "graduation", label: t("students.columns.graduation"), render: () => t("format.empty") },
  status: { key: "status", label: t("students.columns.status"), render: (r) => <StatusBadge status={r.status} label={t(`students.statuses.${r.status}`)} /> },
  financial: { key: "financial", label: t("students.columns.financial"), render: (r) => <StatusBadge status={r.financialStatus} label={t(`students.financial.${r.financialStatus}`)} /> },
});

// Cartão do celular (abaixo de 640 px): a seta abre a ficha.
const studentCard = (t: TFunction, search: string) => (r: StudentRow) => (
  <RowCard
    lead={<PersonAvatar name={r.name} photoUrl={r.photoUrl} />}
    title={r.name}
    meta={
      <>
        <span>{t("students.rowSecondary", { age: r.age, unit: r.registeredUnit.name })}</span>
        {r.modalities.map((m) => (
          <ModalityDot key={m.id} name={m.modality.name} />
        ))}
        {r.seals.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {r.seals.map((seal) => (
              <StatusBadge key={seal} status={seal} label={t(`students.seals.${seal}`)} />
            ))}
          </span>
        )}
      </>
    }
    badge={<StatusBadge status={r.status} label={t(`students.statuses.${r.status}`)} />}
    action={
      <Link to={`/alunos/${r.id}${search}`} aria-label={t("students.record.open", { name: r.name })} className="inline-flex min-h-11 min-w-11 items-center justify-center">
        <ChevronRight aria-hidden="true" className="size-5" />
      </Link>
    }
  />
);

function Content({ accountId }: { accountId: string }) {
  const { t } = useTranslation();
  const { visible, toggle } = useStudentColumns(accountId);
  const { id } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const narrow = useBelowSm();
  const scope = useUnitScope();
  const unitName = scope.units.find((u) => u.id === scope.selected)?.name;
  const all = allColumns(t, search);
  const columns = [all.name, ...visible.map((c) => all[c])];
  const header = ({ counts }: { counts?: Record<string, number> }) => {
    const active = counts ? t("students.activeCount", { count: counts.active }) : t("students.subtitleLoading");
    const subtitle = scope.selected === ALL || !unitName ? t("students.subtitleAll", { active }) : t("students.subtitle", { unit: unitName, active });
    return (
      <PageHeader
        title={t("students.title")}
        subtitle={subtitle}
        actions={
          narrow ? undefined : (
            <>
              <ComingSoon variant="button" label={t("students.exportCsv")} />
              <NewEnrollmentLink />
            </>
          )
        }
      />
    );
  };
  const columnsMenu = (
    <Popover
      label={t("students.columnsButton")}
      trigger={(props) => (
        <Button variant="secondary" className="h-9 rounded-full" {...props}>
          <Columns3 aria-hidden="true" />
          {t("students.columnsButton")}
        </Button>
      )}
    >
      {() => (
        <div className="flex flex-col">
          {OPTIONAL_COLUMNS.map((c) => (
            <label key={c} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" className="size-5" checked={visible.includes(c)} onChange={() => toggle(c)} />
              {t(`students.columns.${c}`)}
            </label>
          ))}
        </div>
      )}
    </Popover>
  );
  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        header={header}
        searchPlaceholder={t("students.search")}
        canvasPagination
        canvasStates
        cards={studentCard(t, search)}
        cardsBelow="sm"
        key={version}
        columns={columns}
        fetchPage={fetchStudents}
        rowKey={(r) => r.id}
        filterKeys={["unitId", "ageRangeId", "seal", "modalityId", "classId", "levelId", "status", "financial"]}
        filters={(p) => <StudentFilters {...p} columnsMenu={columnsMenu} trailing={<NewEnrollmentLink className="ml-auto" />} />}
      />
      {id && <StudentRecordPanel id={id} onClose={() => navigate(`/alunos${search}`)} onChanged={() => setVersion((v) => v + 1)} />}
    </div>
  );
}

// RF-ALU-01: lista de alunos para a gestão; a barreira de dados é o servidor (403 vira "sem permissão" na própria lista).
export function StudentsPage() {
  const { state } = useSession();
  const accountId = state.status === "ready" ? state.session.account.id : "";
  return (
    <ManagementLayout activeId="students">
      <Content key={accountId} accountId={accountId} />
    </ManagementLayout>
  );
}
