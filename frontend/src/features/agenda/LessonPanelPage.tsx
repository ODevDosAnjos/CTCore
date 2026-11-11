import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ModalityDot } from "@/components/ui/modality-dot";
import { PersonAvatar } from "@/components/ui/person-row";
import { useSession } from "@/features/auth/SessionProvider";
import { usePermissions } from "@/features/permissions/usePermissions";
import { StudentSimpleList } from "@/features/students/StudentSimpleList";
import { br, hourLabel, weekday } from "./agendaDates";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { EditLessonDialog } from "./EditLessonDialog";
import { cancelReasonText, lessonName } from "./LessonCard";
import { useLesson, type LessonDetail } from "./useLesson";

// Só http e https viram link (como o painel da turma).
function safeLink(link: string | null) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

// Link do grupo sem o protocolo: "chat.whatsapp.com/…F7kQ".
const shortLink = (href: string) => {
  const bare = href.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return bare.length > 28 ? `${bare.slice(0, bare.indexOf("/") + 1)}…${bare.slice(-4)}` : bare;
};

function BackLink() {
  const { t } = useTranslation();
  const { search } = useLocation();
  return (
    <Link to={{ pathname: "/agenda", search }} className="inline-flex min-h-11 items-center self-start text-sm underline">
      {t("agenda.panel.back")}
    </Link>
  );
}

// Bloco plano do canvas: título pequeno e conteúdo.
function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
      <div className="break-words">{children}</div>
    </section>
  );
}

// Gaveta da aula sobre a agenda: fechar volta a /agenda na mesma semana (D3).
function DrawerShell({ title, subtitle, footer, children }: { title?: string; subtitle?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search } = useLocation();
  return (
    <Drawer scrim="canvas" open onOpenChange={(open) => !open && void navigate({ pathname: "/agenda", search })} title={title ?? t("agenda.panel.eyebrow")} subtitle={subtitle} footer={footer}>
      {children}
    </Drawer>
  );
}

function Panel({ lesson, onChanged }: { lesson: LessonDetail; onChanged: () => void }) {
  const { t } = useTranslation();
  const { search } = useLocation();
  const [dialog, setDialog] = useState<"edit" | "cancel">();
  const group = safeLink(lesson.groupLink);
  const cancelled = lesson.status === "CANCELLED";
  const { permissions } = usePermissions();
  const { state } = useSession();
  const role = state.status === "ready" ? state.session.links.find((l) => l.id === state.session.activeLinkId)?.role : undefined;
  const teacherRecord = role === "TEACHER" && !!permissions ? permissions.STUDENT_RECORD !== "NONE" : undefined;
  const canNotify = !!permissions && permissions.ANNOUNCEMENTS !== "NONE" && !!lesson.class;
  // RF-COM-02: abre o comunicado já preenchido (aula cancelada ou aviso geral), com a turma, a data e o horário.
  const noticeLink = `/comunicados/novo?${new URLSearchParams({ classId: lesson.class?.id ?? "", type: cancelled ? "CANCELED_CLASS" : "GENERAL", date: lesson.date, time: lesson.startsAt })}`;
  const day = t(`agenda.weekdaysLong.${weekday(lesson.date)}`).split("-")[0];
  const reason = cancelled ? cancelReasonText(lesson, t) : null;
  const footer = (
    <div className="flex w-full flex-wrap items-center gap-2">
      {canNotify ? (
        <Button variant="whatsapp" className="min-h-11" asChild>
          <Link to={noticeLink}>
            <MessageCircle aria-hidden="true" />
            {t("agenda.panel.notify")}
          </Link>
        </Button>
      ) : (
        <Button variant="whatsapp" className="min-h-11" disabled>
          <MessageCircle aria-hidden="true" />
          {t("agenda.panel.notify")}
        </Button>
      )}
      {lesson.canEdit && (
        <Button variant="secondary" className="min-h-11" onClick={() => setDialog("edit")}>
          {t("agenda.panel.edit")}
        </Button>
      )}
      {lesson.canViewClass && lesson.class && (
        <Button variant="secondary" className="min-h-11" asChild>
          <Link to={`/turmas/${lesson.class.id}`}>{t("agenda.panel.viewClass")}</Link>
        </Button>
      )}
      {lesson.canCancel && (
        <Button variant="danger" className="ml-auto min-h-11" onClick={() => setDialog("cancel")}>
          {t("agenda.panel.cancel")}
        </Button>
      )}
    </div>
  );
  return (
    <DrawerShell
      title={lessonName(lesson)}
      footer={footer}
      subtitle={
        <>
          <div className="flex flex-wrap gap-2">
            <ModalityDot name={lesson.modality.name} />
            {!lesson.class && <Badge tone="neutral">{t("agenda.adhoc")}</Badge>}
            {lesson.substitute && <Badge tone="info">{t("agenda.substitute")}</Badge>}
            <StatusBadge status={lesson.status} label={t(`agenda.panel.statuses.${lesson.status}`)} />
          </div>
          <p className="break-words text-sm text-muted-foreground">
            {t("agenda.panel.whenLine", { day, date: br(lesson.date), from: hourLabel(lesson.startsAt), to: hourLabel(lesson.endsAt), unit: lesson.unit.name })}
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {reason && (
          <Banner tone="ok">
            <span className="font-medium">{t("agenda.panel.reason")}</span> {reason}
          </Banner>
        )}
        <Block label={t("agenda.panel.teacher")}>
          <span className="flex flex-wrap items-center gap-2">
            <PersonAvatar name={lesson.teacher.name} size="sm" />
            {lesson.teacher.name}
            {lesson.substitute && <Badge tone="info">{t("agenda.substitute")}</Badge>}
          </span>
        </Block>
        {lesson.substitute && lesson.head && <Block label={t("agenda.panel.head")}>{lesson.head.name}</Block>}
        {!lesson.class && <Block label={t("agenda.panel.visibility")}>{lesson.visibilityClass?.name ?? t("agenda.panel.visibilityAll")}</Block>}
        {lesson.class && (
          <>
            <Block label={t("agenda.panel.students")}>{t("agenda.panel.activeCount", { count: lesson.activeStudents })}</Block>
            <Block label={t("agenda.panel.trials")}>{lesson.trialClasses > 0 ? t("agenda.panel.trialsCount", { count: lesson.trialClasses }) : t("agenda.panel.trialsNone")}</Block>
            <Block label={t("agenda.panel.group")}>
              {group ? (
                <a href={group} target="_blank" rel="noopener noreferrer" className="underline">
                  {shortLink(group)}
                </a>
              ) : (
                t("agenda.panel.noGroup")
              )}
            </Block>
          </>
        )}
        {cancelled && (
          <Block label={t("agenda.panel.noticeTitle")}>
            {t("agenda.panel.noticeText", { name: lessonName(lesson), date: br(lesson.date), from: lesson.startsAt, to: lesson.endsAt, reason: reason ?? "" })}
          </Block>
        )}
        {lesson.class && (
          <section className="flex flex-col gap-2">
            <h3 className="text-base font-semibold">{t("students.simple.title")}</h3>
            <StudentSimpleList
              lessonId={lesson.id}
              recordHref={teacherRecord ? (sid) => ({ pathname: `/agenda/aulas/${lesson.id}/alunos/${sid}`, search }) : undefined}
              noRecordNotice={teacherRecord === false}
            />
          </section>
        )}
        <EditLessonDialog lesson={dialog === "edit" ? lesson : null} onClose={() => setDialog(undefined)} onSaved={onChanged} />
        <CancelLessonDialog lesson={dialog === "cancel" ? lesson : null} onClose={() => setDialog(undefined)} onSaved={onChanged} />
      </div>
    </DrawerShell>
  );
}

function Content() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const api = useLesson(id);
  if (api.status === "loading") {
    return (
      <DrawerShell>
        <LoadingState />
      </DrawerShell>
    );
  }
  if (api.status === "forbidden") {
    return (
      <DrawerShell>
        <ForbiddenState />
      </DrawerShell>
    );
  }
  if (api.status === "notFound") {
    return (
      <DrawerShell>
        <EmptyState title={t("agenda.panel.notFoundTitle")} text={t("agenda.panel.notFoundText")} action={<BackLink />} />
      </DrawerShell>
    );
  }
  if (!api.lesson) {
    return (
      <DrawerShell>
        <ErrorState onRetry={api.retry} />
      </DrawerShell>
    );
  }
  return <Panel lesson={api.lesson} onChanged={api.retry} />;
}

// RF-AGE-02: painel da aula em gaveta sobre a agenda (a página-base vem da rota-pai); a barreira de dados é o servidor.
export function LessonPanelPage() {
  return <Content />;
}
