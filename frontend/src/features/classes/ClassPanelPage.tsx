import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import type { TFunction } from "i18next";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Banner } from "@/components/ui/banner";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { PersonRow } from "@/components/ui/person-row";
import { usePermissions } from "@/features/permissions/usePermissions";
import { formatDate, relativeDay } from "@/lib/format";
import { ClassesPage } from "./ClassesPage";
import { hourText, scheduleText } from "./classText";
import { ClassFormDialog } from "./ClassFormDialog";
import { DeactivateClassDialog } from "./DeactivateClassDialog";
import { useClass, type ClassDetail } from "./useClasses";

// Bloco plano do canvas: título em negrito e conteúdo, sem cartão.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// D7: só http e https viram botão; qualquer outro esquema (javascript:, data:) é ignorado.
function safeLink(link: string | null) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

// "chat.whatsapp.com/…Lp2A": o endereço sem o miolo.
function shortLink(href: string) {
  const u = new URL(href);
  const path = u.pathname.replace(/^\/|\/$/g, "");
  return path ? `${u.host}/…${path.slice(-4)}` : u.host;
}

// "Hoje, 19h30 · Rafael Duarte", "Amanhã, …" ou "dd/mm, …".
function nextClassText(t: TFunction, next: NonNullable<ClassDetail["nextClass"]>) {
  const days = relativeDay(next.date);
  const day = days === 0 ? t("classes.panel.today") : days === -1 ? t("classes.panel.tomorrow") : formatDate(next.date).slice(0, 5);
  return t("classes.panel.nextLine", { day, time: hourText(next.startsAt), teacher: next.teacher.name });
}

// Alunos mostrados no painel; o restante vai por "Ver todos os alunos" (D5).
const SHOWN = 10;

// Gaveta da turma sobre a lista: fechar volta para /turmas.
function DrawerShell({ hidden, title, badge, subtitle, footer, children }: { hidden?: boolean; title?: string; badge?: ReactNode; subtitle?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (hidden) return null;
  return (
    <Drawer
      scrim="canvas"
      open
      onOpenChange={(open) => !open && void navigate("/turmas")}
      title={title ?? t("classes.panel.eyebrow")}
      badge={badge}
      subtitle={subtitle}
      footer={footer}
    >
      {children}
    </Drawer>
  );
}

function Panel({ klass, onRefresh }: { klass: ClassDetail; onRefresh: () => Promise<void> }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const [deactivating, setDeactivating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string>();
  const { permissions } = usePermissions();
  const canManage = !!permissions && permissions.CLASSES_MANAGE !== "NONE";
  const group = safeLink(klass.groupLink);
  const inactive = klass.status !== "ACTIVE";
  const canNotify = !!permissions && permissions.ANNOUNCEMENTS !== "NONE" && !inactive;

  const edit = (
    <Button key="edit" variant="secondary" className={narrow ? "w-full min-h-11" : "min-h-11"} disabled={!canManage || inactive} onClick={() => setEditing(true)}>
      {t(narrow ? "classes.panel.editNarrow" : "classes.panel.edit")}
    </Button>
  );
  const notify = canNotify ? (
    <Button key="notify" variant="whatsapp" className={narrow ? "w-full min-h-11" : "min-h-11"} asChild>
      <Link to={`/comunicados/novo?classId=${klass.id}`}>{t("classes.panel.notify")}</Link>
    </Button>
  ) : (
    <Button key="notify" variant="whatsapp" className={narrow ? "w-full min-h-11" : "min-h-11"} disabled>
      {t("classes.panel.notify")}
    </Button>
  );
  const open = group ? (
    <Button key="group" variant="secondary" className={narrow ? "w-full min-h-11" : "min-h-11"} asChild>
      <a href={group} target="_blank" rel="noopener noreferrer">
        {t("classes.panel.openGroup")}
      </a>
    </Button>
  ) : (
    <Button key="group" variant="secondary" className={narrow ? "w-full min-h-11" : "min-h-11"} disabled>
      {t("classes.panel.openGroup")}
    </Button>
  );
  const deactivate = (
    <Button key="deactivate" variant="danger" className={narrow ? "w-full min-h-11" : "ml-auto min-h-11"} disabled={!canManage || inactive} onClick={() => setDeactivating(true)}>
      {t(narrow ? "classes.panel.deactivateNarrow" : "classes.panel.deactivate")}
    </Button>
  );
  // Celular: "Editar turma" fica por último (fixo ao pé) e "Desativar turma" logo acima.
  const footer = narrow ? (
    <div className="flex w-full flex-col gap-2">{[notify, open, deactivate, edit]}</div>
  ) : (
    <div className="flex w-full flex-wrap items-center gap-2">{[edit, notify, open, deactivate]}</div>
  );

  const primary = klass.students.filter((s) => s.primary).length;
  const subtitle = [klass.unit.name, klass.ageRange?.name, scheduleText(t, klass.schedule)].filter(Boolean).join(" · ");

  return (
    <>
    {/* Como no canvas, a janela (editar, desativar) abre sobre a lista: a gaveta sai de cena enquanto ela está aberta. */}
    <DrawerShell
      hidden={editing || deactivating}
      title={klass.name}
      badge={
        <>
          <Badge tone="neutral">{klass.modality.name}</Badge>
          {klass.overCapacity && klass.capacity !== null && <Badge tone="warn">{t("classes.over", { count: klass.activeStudents, capacity: klass.capacity })}</Badge>}
          {inactive && <StatusBadge status={klass.status} label={t(`classes.statuses.${klass.status}`)} />}
        </>
      }
      subtitle={<p className="break-words text-sm text-muted-foreground">{subtitle}</p>}
      footer={footer}
    >
      <div className="flex flex-col gap-6">
        {notice && <Banner tone="ok">{notice}</Banner>}
        <Section title={t("classes.panel.nextClass")}>
          <p>{klass.nextClass ? nextClassText(t, klass.nextClass) : t("classes.panel.noNext")}</p>
        </Section>
        <Section title={t("classes.panel.team")}>
          <p className="break-words">
            {[t("classes.panel.headLine", { name: klass.head.name }), ...klass.assistants.map((a) => t("classes.panel.assistantLine", { name: a.name }))].join(" · ")}
          </p>
        </Section>
        <Section title={t("classes.panel.capacity")}>
          <p>{klass.capacity === null ? t("classes.panel.noCapacity") : t("classes.panel.capacityLine", { count: klass.capacity })}</p>
        </Section>
        <Section title={t("classes.panel.group")}>
          <p className="break-words">{group ? shortLink(group) : t("classes.panel.noGroup")}</p>
        </Section>
        <Section title={t("classes.panel.activeStudents")}>
          {klass.students.length === 0 ? (
            <p>{t("classes.panel.noStudents")}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t("classes.panel.studentsSummary", { primary, other: klass.students.length - primary })}</p>
              <ul className="flex flex-col gap-3">
                {klass.students.slice(0, SHOWN).map((s) => (
                  <li key={s.id}>
                    <PersonRow
                      name={s.name}
                      size="sm"
                      secondary={t(s.primary ? "classes.panel.primary" : "classes.panel.otherSlot")}
                      action={
                        s.belt && s.beltColor ? (
                          <GraduationBelt
                            name={s.belt}
                            color={s.beltColor}
                            secondaryColor={s.beltSecondaryColor}
                            degree={s.degree}
                            label={s.degree ? t("classes.panel.belt", { level: s.belt, count: s.degree }) : t("classes.panel.beltNoDegree", { level: s.belt })}
                          />
                        ) : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link to={`/alunos?classId=${klass.id}`} className="inline-flex min-h-11 items-center text-sm underline">
            {t("classes.panel.viewAllStudents")}
          </Link>
        </Section>
      </div>
    </DrawerShell>
    <ClassFormDialog open={editing} klass={klass} onClose={() => setEditing(false)} onSaved={() => void onRefresh()} />
    <DeactivateClassDialog
      klass={deactivating ? klass : null}
      onClose={() => setDeactivating(false)}
      onDone={() => {
        setNotice(t("classes.panel.deactivateDialog.done"));
        void onRefresh();
      }}
    />
    </>
  );
}

function Content() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const api = useClass(id);
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
        <EmptyState title={t("classes.panel.notFoundTitle")} text={t("classes.panel.notFoundText")} />
      </DrawerShell>
    );
  }
  if (!api.klass) {
    return (
      <DrawerShell>
        <ErrorState onRetry={api.retry} />
      </DrawerShell>
    );
  }
  return <Panel klass={api.klass} onRefresh={api.refresh} />;
}

// RF-TUR-02: painel da turma em gaveta sobre a lista; a barreira de dados é o servidor.
export function ClassPanelPage() {
  return (
    <ClassesPage>
      <Content />
    </ClassesPage>
  );
}
