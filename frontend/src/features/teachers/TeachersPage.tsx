import { useTranslation } from "react-i18next";
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { TFunction } from "i18next";
import { RowCard } from "@/components/query/RowCard";
import { QueryPage } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { PersonAvatar, PersonRow } from "@/components/ui/person-row";
import { ModalityDot } from "@/components/ui/modality-dot";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { usePermissions } from "@/features/permissions/usePermissions";
import { TeacherFilters } from "./TeacherFilters";
import { TeacherFormDialog } from "./TeacherFormDialog";
import { fetchTeachers, type Teacher } from "./useTeachers";
import { PageHeader } from "@/components/ui/page-header";

// Faixa por modalidade com nível ("Faixa roxa · 2 graus"); sem nível a coluna mostra o traço.
const belts = (t: TFunction, r: Teacher) => {
  const graded = r.modalities.filter((m) => m.level !== null && m.levelColor !== null);
  return graded.length === 0 ? (
    t("format.empty")
  ) : (
    <ul className="flex flex-col gap-1">
      {graded.map((m) => (
        <li key={m.id}>
          <GraduationBelt
            name={m.level!}
            color={m.levelColor!}
            secondaryColor={m.levelSecondaryColor}
            degree={m.degree ?? 0}
            label={m.degree ? t("teachers.belt", { level: m.level, count: m.degree }) : t("teachers.beltNoDegree", { level: m.level })}
          />
        </li>
      ))}
    </ul>
  );
};

// Situação: convite enviado quando há acesso pendente (RN-PRO-02); senão a situação do cadastro.
const statusBadge = (t: TFunction, r: Teacher) =>
  r.status === "ACTIVE" && r.access === "PENDING" ? <StatusBadge status="PENDING" label={t("teachers.invited")} /> : <StatusBadge status={r.status} label={t(`teachers.statuses.${r.status}`)} />;

const columns = (t: TFunction): Column<Teacher>[] => [
  {
    key: "name",
    label: t("teachers.columns.name"),
    sortable: true,
    render: (r) => (
      <PersonRow
        name={r.name}
        photoUrl={r.photoUrl}
        size="sm"
        title={
          <Link to={`/professores/${r.id}`} className="inline-flex min-h-11 min-w-0 items-center break-words font-bold">
            {r.name}
          </Link>
        }
      />
    ),
  },
  {
    key: "modalities",
    label: t("teachers.columns.modalities"),
    render: (r) => (
      <ul>
        {r.modalities.map((m) => (
          <li key={m.id}>
            <ModalityDot name={m.name} />
          </li>
        ))}
      </ul>
    ),
  },
  { key: "units", label: t("teachers.columns.units"), render: (r) => r.units.map((u) => u.name).join(", ") },
  { key: "graduation", label: t("teachers.columns.graduation"), render: (r) => belts(t, r) },
  { key: "classes", label: t("teachers.columns.classes"), render: (r) => r.classCount },
  { key: "status", label: t("teachers.columns.status"), render: (r) => statusBadge(t, r) },
];

const card = (t: TFunction) => (r: Teacher) => (
  <RowCard
    lead={<PersonAvatar name={r.name} photoUrl={r.photoUrl} size="sm" />}
    title={r.name}
    meta={
      <>
        <ul>
          {r.modalities.map((m) => (
            <li key={m.id}>
              <ModalityDot name={m.name} />
            </li>
          ))}
        </ul>
        {belts(t, r)}
        <span>{r.units.map((u) => u.name).join(", ")}</span>
        <span>{t("teachers.classCount", { count: r.classCount })}</span>
      </>
    }
    badge={statusBadge(t, r)}
    action={
      <Button asChild variant="secondary">
        <Link to={`/professores/${r.id}`} aria-label={t("teachers.viewAria", { name: r.name })}>
          {t("query.viewRow")}
        </Link>
      </Button>
    }
  />
);

function Content() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const { permissions } = usePermissions();
  const canWrite = !!permissions && permissions.TEACHERS !== "NONE";
  // Subtítulo do canvas: ativos e ativos com acesso, vindos de `counts` da lista.
  const header = ({ counts }: { counts?: Record<string, number> }) => (
    <PageHeader
      title={t("teachers.title")}
      subtitle={counts ? t("teachers.subtitle", { count: counts.active, withAccess: counts.withAccess }) : t("teachers.subtitleLoading")}
      actions={
        canWrite && (
          <Button className="min-h-11" onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            {t("teachers.form.newButton")}
          </Button>
        )
      }
    />
  );
  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        header={header}
        defaultFilters={{ status: "ACTIVE" }}
        onRowClick={(r) => void navigate(`/professores/${r.id}`)}
        canvasStates
        searchPlaceholder={t("teachers.search")}
        columns={columns(t)}
        cardsBelow="sm"
        cards={card(t)}
        fetchPage={fetchTeachers}
        rowKey={(r) => r.id}
        filterKeys={["modalityId", "unitId", "status"]}
        filters={(p) => <TeacherFilters {...p} />}
      />
      <TeacherFormDialog open={creating} onClose={() => setCreating(false)} onSaved={(saved) => void navigate(`/professores/${saved.id}`)} />
    </div>
  );
}

// RF-PRO-01 e RF-PRO-03: lista (`children`: a gaveta do painel, dentro do mesmo layout) com "Novo professor"; a barreira de dados é o servidor (403 vira "sem permissão" na própria lista).
export function TeachersPage({ children }: { children?: ReactNode }) {
  return (
    <ManagementLayout activeId="teachers">
      <Content />
      {children}
    </ManagementLayout>
  );
}
