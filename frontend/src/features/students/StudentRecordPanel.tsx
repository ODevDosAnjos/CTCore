import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Receipt, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { SidePanel } from "@/components/SidePanel";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { WhatsAppButton } from "@/components/whatsapp";
import { Banner } from "@/components/ui/banner";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { OneOffChargeDialog } from "@/features/charges/OneOffChargeDialog";
import { usePermissions } from "@/features/permissions/usePermissions";
import { StudentFinancialTab, isOverdue } from "./StudentFinancialTab";
import { StudentEditDialog } from "./StudentEditDialog";
import { RecordEnrollment } from "./RecordEnrollment";
import { RecordGraduations } from "./RecordGraduations";
import { RecordGuardians } from "./RecordGuardians";
import { RecordHistory } from "./RecordHistory";
import { RecordSummary } from "./RecordSummary";
import { useStudentCharges } from "@/features/charges/useChargeActions";
import { useEnrollment, useStudentRecord } from "./useStudentRecord";
import type { EnrollmentStatus, StudentRecord } from "./types";

const TABS = ["summary", "enrollment", "financial", "graduations", "guardians", "history"] as const;
type Tab = (typeof TABS)[number];
// O Professor vê só o Resumo e os Responsáveis (RF-ALU-03, R26): matrícula, histórico e o que vier depois são da gestão.
const TEACHER_TABS: readonly Tab[] = ["summary", "guardians"];

function Header({ record, status, overdue, since, onCharge }: { record: StudentRecord; status?: EnrollmentStatus; overdue?: boolean; since?: string | null; onCharge?: () => void }) {
  const { t } = useTranslation();
  const line = [t("students.age", { count: record.age }), since && t("students.record.since", { date: `${since.slice(5, 7)}/${since.slice(0, 4)}` }), record.registeredUnit.name].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 sm:items-start sm:pr-10">
        {record.photoUrl ? <img src={record.photoUrl} alt="" className="size-16 shrink-0 rounded-full object-cover sm:row-span-2" /> : <Avatar name={record.name} size="lg" decorative className="sm:row-span-2" />}
        <div className="min-w-0">
          <p className="break-normal font-heading text-[28px] font-semibold uppercase leading-none [hyphens:none]">{record.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{line}</p>
        </div>
        <div className="col-span-2 flex flex-wrap gap-1 sm:col-span-1 sm:col-start-2">
          {status && <StatusBadge status={status} label={t(`students.statuses.${status}`)} />}
          {overdue !== undefined && <StatusBadge status={overdue ? "OVERDUE" : "CURRENT"} label={t(overdue ? "students.record.financial.overdue" : "students.record.financial.current")} />}
          {(record.seals ?? []).map((seal) => (
            <StatusBadge key={seal} status={seal} label={t(`students.seals.${seal}`)} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <WhatsAppButton phone={record.contact?.phone ?? undefined} variant="whatsapp" />
        {onCharge && (
          <Button type="button" variant="secondary" icon={<Receipt aria-hidden="true" />} className="min-h-11" onClick={onCharge}>
            {t("students.record.charge")}
          </Button>
        )}
        <ComingSoon variant="button" label={t("students.record.moreActions")} />
      </div>
    </div>
  );
}

// Abas com setas, Home e End (padrão WAI-ARIA): só a aba ativa entra na ordem de Tab.
function Tabs({ tab, tabs, onChange }: { tab: Tab; tabs: readonly Tab[]; onChange: (t: Tab) => void }) {
  const { t } = useTranslation();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  function onKey(e: KeyboardEvent) {
    const i = tabs.indexOf(tab);
    const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next]);
    refs.current[tabs[next]]?.focus();
  }
  return (
    <div role="tablist" aria-label={t("students.record.tabsLabel")} onKeyDown={onKey} className="flex flex-nowrap gap-1 overflow-x-auto border-b">
      {tabs.map((id) => (
        <button
          key={id}
          ref={(el) => {
            refs.current[id] = el;
          }}
          role="tab"
          id={`record-tab-${id}`}
          type="button"
          aria-selected={tab === id}
          aria-controls={`record-panel-${id}`}
          tabIndex={tab === id ? 0 : -1}
          onClick={() => onChange(id)}
          className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-md px-3 text-sm ${tab === id ? "border-b-2 border-brand font-semibold" : "text-muted-foreground"}`}
        >
          {t(`students.record.tabs.${id}`)}
        </button>
      ))}
    </div>
  );
}

function Body({ id, onChanged }: { id: string; onChanged?: () => void }) {
  const { t } = useTranslation();
  const { status, data, reload } = useStudentRecord(id);
  const { permissions, status: permStatus } = usePermissions();
  // R18: a ficha que chega com `?pedido=` abre na matrícula, onde a troca pedida abre preenchida.
  const asked = useSearchParams()[0].has("pedido");
  const [tab, setTab] = useState<Tab>(asked ? "enrollment" : "summary");
  const [editing, setEditing] = useState(false);
  const [charging, setCharging] = useState(false);
  // Só a gestão vê o botão; a barreira é o servidor.
  const canEdit = !!permissions && permissions.STUDENT_MANAGE !== "NONE";
  const enrollment = useEnrollment(id, canEdit);
  // D6: só quem tem Cobranças lê as cobranças do aluno; o Professor nem faz o pedido.
  const canCollect = !!permissions && permissions.COLLECTIONS !== "NONE";
  const charges = useStudentCharges(id, canEdit && canCollect);
  let state: ReactNode = null;
  if (status === "loading" || permStatus === "loading") state = <LoadingState />;
  else if (status === "forbidden") state = <ForbiddenState />;
  else if (status === "notFound") state = <EmptyState title={t("students.record.notFound")} text={t("students.record.notFoundText")} />;
  else if (status === "error" || !data) state = <ErrorState onRetry={reload} />;
  const bar = (
    <>
      <div className="-mx-4 -mt-4 mb-4 flex items-center gap-2 border-b border-divider px-2 sm:hidden">
        <Dialog.Close asChild>
          <Button type="button" variant="ghost" size="icon" aria-label={t("students.record.back")}>
            <ArrowLeft aria-hidden="true" />
          </Button>
        </Dialog.Close>
        <p className="min-w-0 flex-1 truncate font-semibold">{t("students.record.title")}{data && <span className="font-normal text-muted-foreground"> · {data.registeredUnit.name}</span>}</p>
      </div>
      <Dialog.Close asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t("common.close")} className="absolute right-0 top-0 hidden sm:inline-flex">
          <X aria-hidden="true" />
        </Button>
      </Dialog.Close>
    </>
  );
  if (state || !data) return <div className="relative">{bar}{state}</div>;
  return (
    <div className="relative flex flex-col gap-4">
      {bar}
      <Header record={data} status={enrollment.data?.status} overdue={charges.status === "ready" ? isOverdue(charges.data) : undefined} since={enrollment.data?.status === "NONE" ? null : enrollment.data?.enrolledAt} onCharge={canEdit && canCollect ? () => setCharging(true) : undefined} />
      {charging && <OneOffChargeDialog student={{ id, name: data.name }} onClose={() => setCharging(false)} onDone={() => { charges.reload(); onChanged?.(); }} />}
      <StudentEditDialog
        studentId={id}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={() => {
          reload();
          onChanged?.();
        }}
      />
      {!canEdit && <Banner tone="info">{t("students.record.teacherView")}</Banner>}
      <Tabs tab={tab} tabs={canEdit ? (canCollect ? TABS : TABS.filter((x) => x !== "financial")) : TEACHER_TABS} onChange={setTab} />
      <div role="tabpanel" id={`record-panel-${tab}`} aria-labelledby={`record-tab-${tab}`}>
        {tab === "summary" && <RecordSummary record={data} modalities={enrollment.data?.modalities} charges={charges.status === "ready" ? charges.data : undefined} canCollect={canEdit && canCollect} onEdit={canEdit ? () => setEditing(true) : undefined} />}
        {tab === "enrollment" && <RecordEnrollment studentId={id} studentName={data.name} canGrant={!!permissions && permissions.BENEFITS !== "NONE"} enrollment={enrollment} onChanged={() => { reload(); onChanged?.(); }} />}
        {tab === "financial" && <StudentFinancialTab charges={charges} onChanged={() => onChanged?.()} onCharge={canEdit && canCollect ? () => setCharging(true) : undefined} />}
        {tab === "graduations" && <RecordGraduations />}
        {tab === "guardians" && <RecordGuardians record={data} onChanged={reload} canManage={canEdit} />}
        {tab === "history" && <RecordHistory id={id} />}
      </div>
    </div>
  );
}

// RF-ALU-03: ficha em painel lateral (tela cheia no celular). O servidor decide o que cada perfil vê; aqui só se mostra o que veio.
export function StudentRecordPanel({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged?: () => void }) {
  const { t } = useTranslation();
  return (
    <SidePanel open onOpenChange={(open) => !open && onClose()} title={t("students.record.title")} headless>
      <Body key={id} id={id} onChanged={onChanged} />
    </SidePanel>
  );
}
