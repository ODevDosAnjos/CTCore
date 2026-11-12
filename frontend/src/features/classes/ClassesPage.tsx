import { useCallback, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import type { TFunction } from "i18next";
import { useBelowSm } from "@/components/query/useBelowSm";
import { RowCard } from "@/components/query/RowCard";
import { QueryPage, type Query } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { Person } from "@/components/ui/avatar";
import { ModalityDot } from "@/components/ui/modality-dot";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { usePermissions } from "@/features/permissions/usePermissions";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { scheduleText } from "./classText";
import { ClassFilters } from "./ClassFilters";
import { ClassFormDialog } from "./ClassFormDialog";
import { fetchClasses, type TrainingClass } from "./useClasses";
import { PageHeader } from "@/components/ui/page-header";

// RN-TUR-02: acima da capacidade vira selo âmbar na mesma célula; sem capacidade, "14 · sem limite".
function StudentsCell({ r, compact }: { r: TrainingClass; compact?: boolean }) {
  const { t } = useTranslation();
  const text =
    r.capacity === null
      ? t(compact ? "classes.cardNoCap" : "classes.studentsNoCap", { count: r.activeStudents })
      : t(compact ? "classes.cardStudents" : "classes.students", { count: r.activeStudents, capacity: r.capacity });
  return (
    <span className="flex flex-wrap items-center gap-2">
      {text}
      {r.overCapacity && r.capacity !== null && <Badge tone="warn">{t("classes.over", { count: r.activeStudents, capacity: r.capacity })}</Badge>}
    </span>
  );
}

const teacherCell = (t: TFunction, r: TrainingClass) => (
  <Person name={r.head.name} size="sm" secondary={r.assistants.length > 0 ? t("classes.assistants", { names: r.assistants.map((a) => a.name).join(", ") }) : undefined} />
);

const columns = (t: TFunction): Column<TrainingClass>[] => [
  {
    key: "name",
    label: t("classes.columns.name"),
    sortable: true,
    render: (r) => (
      <Link to={`/turmas/${r.id}`} className="inline-flex min-h-11 min-w-0 items-center break-words font-bold">
        {r.name}
      </Link>
    ),
  },
  { key: "modality", label: t("classes.columns.modality"), render: (r) => <ModalityDot name={r.modality.name} /> },
  { key: "ageRange", label: t("classes.columns.ageRange"), render: (r) => r.ageRange?.name ?? t("classes.none") },
  { key: "schedule", label: t("classes.columns.schedule"), render: (r) => scheduleText(t, r.schedule) },
  { key: "head", label: t("classes.columns.head"), render: (r) => teacherCell(t, r) },
  { key: "students", label: t("classes.columns.students"), render: (r) => <StudentsCell r={r} /> },
  { key: "status", label: t("classes.columns.status"), render: (r) => <StatusBadge status={r.status} label={t(`classes.statuses.${r.status}`)} /> },
];

const card = (t: TFunction) => (r: TrainingClass) => (
  <RowCard
    title={r.name}
    meta={
      <>
        <ModalityDot name={r.modality.name} />
        <span>{t("classes.cardLine", { days: scheduleText(t, r.schedule), teacher: r.head.name })}</span>
        <StudentsCell r={r} compact />
      </>
    }
    badge={r.status === "INACTIVE" ? <StatusBadge status={r.status} label={t(`classes.statuses.${r.status}`)} /> : undefined}
    action={
      <Button asChild variant="secondary">
        <Link to={`/turmas/${r.id}`} aria-label={t("classes.viewAria", { name: r.name })}>
          {t("query.viewRow")}
        </Link>
      </Button>
    }
  />
);

function Content() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const narrow = useBelowSm();
  const [creating, setCreating] = useState(false);
  const { permissions } = usePermissions();
  const canManage = !!permissions && permissions.CLASSES_MANAGE !== "NONE";
  // A unidade vem da barra (D2): "todas" não filtra. A identidade de fetchPage muda só quando a unidade muda.
  const scope = useUnitScope();
  const unitId = scope.selected && scope.selected !== ALL ? scope.selected : undefined;
  const unitName = scope.units.find((u) => u.id === scope.selected)?.name;
  const fetchPage = useCallback((q: Query) => fetchClasses(q, unitId), [unitId]);
  const header = ({ counts }: { counts?: Record<string, number> }) => {
    const active = counts ? t("classes.activeCount", { count: counts.active }) : t("classes.subtitleLoading");
    return (
      <PageHeader
        title={t("classes.title")}
        subtitle={unitId && unitName ? t("classes.subtitle", { unit: unitName, active }) : t("classes.subtitleAll", { active })}
        actions={
          canManage &&
          !narrow && (
            <Button className="min-h-11" onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" />
              {t("classes.newButton")}
            </Button>
          )
        }
      />
    );
  };
  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        header={header}
        searchPlaceholder={t("classes.search")}
        canvasPagination
        canvasStates
        columns={columns(t)}
        cardsBelow="sm"
        cards={card(t)}
        fetchPage={fetchPage}
        rowKey={(r) => r.id}
        onRowClick={(r) => void navigate(`/turmas/${r.id}`)}
        rowClassName={(r) => (r.status === "INACTIVE" ? "opacity-60" : undefined)}
        filterKeys={["modalityId", "teacherId", "ageRangeId", "weekday", "status"]}
        filters={(p) => <ClassFilters {...p} />}
      />
      {canManage && narrow && (
        <Button className="w-full min-h-11" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" />
          {t("classes.newButton")}
        </Button>
      )}
      <ClassFormDialog open={creating} onClose={() => setCreating(false)} onSaved={(saved) => void navigate(`/turmas/${saved.id}`)} />
    </div>
  );
}

// RF-TUR-01 e RF-TUR-03: lista de turmas com "Nova turma"; a barreira de dados é o servidor (403 vira "sem permissão" na própria lista).
export function ClassesPage({ children }: { children?: ReactNode }) {
  return (
    <ManagementLayout activeId="classes">
      <Content />
      {children}
    </ManagementLayout>
  );
}
