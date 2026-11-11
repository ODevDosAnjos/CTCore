import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import type { TFunction } from "i18next";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { ModalityDot } from "@/components/ui/modality-dot";
import { PersonAvatar } from "@/components/ui/person-row";
import { WhatsAppButton } from "@/components/whatsapp";
import { usePermissions } from "@/features/permissions/usePermissions";
import { formatDateTime } from "@/lib/format";
import { DeactivateTeacherDialog } from "./DeactivateTeacherDialog";
import { GrantAccessDialog } from "./GrantAccessDialog";
import { TeacherFormDialog } from "./TeacherFormDialog";
import { TeachersPage } from "./TeachersPage";
import { resendTeacherInvite, useTeacher, type TeacherDetail } from "./useTeachers";

// Bloco plano do canvas: título em negrito e conteúdo, sem cartão.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

// "19:30" vira "19h30"; hora cheia perde os minutos ("10:00" vira "10h").
const hour = (hhmm: string) => hhmm.replace(/^0/, "").replace(":00", "h").replace(":", "h");

// Horários da turma agrupados pelo início: "Seg, Qua e Sex 19h30".
function schedule(t: TFunction, slots: { weekday: number; startsAt: string }[]) {
  const byStart = new Map<string, string[]>();
  for (const s of [...slots].sort((a, b) => a.weekday - b.weekday)) byStart.set(s.startsAt, [...(byStart.get(s.startsAt) ?? []), t(`classes.weekdays.${s.weekday}`)]);
  return [...byStart].map(([start, days]) => `${days.length > 1 ? `${days.slice(0, -1).join(", ")} e ${days.at(-1)}` : days[0]} ${hour(start)}`).join(" · ");
}

// Gaveta do professor sobre a lista: fechar volta para /professores.
function DrawerShell({ title, lead, subtitle, footer, children }: { title?: string; lead?: ReactNode; subtitle?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Drawer scrim="canvas" open onOpenChange={(open) => !open && void navigate("/professores")} title={title ?? t("teachers.panel.eyebrow")} lead={lead} subtitle={subtitle} footer={footer}>
      {children}
    </Drawer>
  );
}

function Panel({ teacher, onRefresh }: { teacher: TeacherDetail; onRefresh: () => Promise<void> }) {
  const { t } = useTranslation();
  const [granting, setGranting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [editing, setEditing] = useState(false);
  const { permissions } = usePermissions();
  const canWrite = !!permissions && permissions.TEACHERS !== "NONE";
  const [notice, setNotice] = useState<string>();

  async function resend() {
    try {
      await resendTeacherInvite(teacher.id);
      setNotice(t("teachers.panel.resendDone"));
    } catch {
      setNotice(t("teachers.panel.resendError"));
    }
  }

  const subtitle = [
    t("teachers.panel.role"),
    teacher.units.map((u) => u.name).join(", ") || null,
    t(`teachers.panel.accessShort.${teacher.access}`),
    teacher.lastAccessAt ? t("teachers.panel.lastAccess", { when: formatDateTime(teacher.lastAccessAt) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const footer = (
    <div className="flex w-full flex-wrap items-center gap-2">
      {canWrite && (
        <Button variant="secondary" className="min-h-11" onClick={() => setEditing(true)}>
          {t("teachers.panel.edit")}
        </Button>
      )}
      {(teacher.access === "NONE" || teacher.access === "ENDED") && (
        <Button variant="secondary" className="min-h-11" disabled={!canWrite} onClick={() => setGranting(true)}>
          {t("teachers.panel.grant.button")}
        </Button>
      )}
      {teacher.access === "PENDING" && (
        <Button variant="secondary" className="min-h-11" disabled={!canWrite} onClick={() => void resend()}>
          {t("teachers.panel.resend")}
        </Button>
      )}
      <WhatsAppButton phone={teacher.phone ?? undefined} />
      <Button variant="danger" className="ml-auto min-h-11" disabled={!canWrite || teacher.status !== "ACTIVE"} onClick={() => setDeactivating(true)}>
        {t("teachers.panel.deactivate")}
      </Button>
    </div>
  );

  const subs = teacher.substitutions;
  const rows = [
    ...teacher.classes.map((c) => ({ key: c.id, name: c.name, role: t(`teachers.panel.classRoles.${c.role}`), when: schedule(t, c.schedule), badge: false })),
    ...subs.map((s) => ({ key: `${s.classId}-${s.startsAt}`, name: s.name, role: t("teachers.panel.classRoles.SUBSTITUTE"), when: formatDateTime(s.startsAt), badge: true })),
  ];

  return (
    <DrawerShell
      title={teacher.name}
      lead={<PersonAvatar name={teacher.name} photoUrl={teacher.photoUrl} size="lg" />}
      subtitle={
        <>
          <p className="break-words text-sm text-muted-foreground">{subtitle}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={teacher.status} label={t(`teachers.statuses.${teacher.status}`)} />
            {teacher.directoryConsent && <StatusBadge status="SCHEDULED" label={t("teachers.panel.inDirectory")} />}
          </div>
        </>
      }
      footer={footer}
    >
      <div className="flex flex-col gap-6">
        {notice && <Banner tone="ok">{notice}</Banner>}
        <Section title={t("teachers.panel.graduations")}>
          {teacher.modalities.length === 0 ? (
            <p>{t("teachers.panel.none")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {teacher.modalities.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3">
                  <ModalityDot name={m.name} />
                  {m.level !== null && m.levelColor !== null ? (
                    <GraduationBelt
                      name={m.level}
                      color={m.levelColor}
                      secondaryColor={m.levelSecondaryColor}
                      degree={m.degree ?? 0}
                      label={m.degree ? t("teachers.belt", { level: m.level, count: m.degree }) : t("teachers.beltNoDegree", { level: m.level })}
                    />
                  ) : (
                    t("format.empty")
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title={t("teachers.panel.about")}>
          <p className="break-words">{teacher.bio ?? t("teachers.panel.noBio")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{teacher.directoryConsent ? t("teachers.panel.listed") : t("teachers.panel.notListed")}</p>
        </Section>
        <Section title={t("teachers.panel.contact")}>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("teachers.panel.phone")}>{teacher.phone ?? t("teachers.panel.none")}</Field>
            <Field label={t("teachers.panel.email")}>{teacher.email ?? t("teachers.panel.none")}</Field>
          </dl>
        </Section>
        <Section title={t("teachers.panel.classes")}>
          {rows.length === 0 ? (
            <p>{t("teachers.panel.noClasses")}</p>
          ) : (
            <table className="w-full overflow-hidden rounded-md border border-divider text-left text-sm">
              <thead className="bg-surface-soft">
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">{t("teachers.panel.classColumn")}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t("teachers.panel.roleColumn")}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t("teachers.panel.scheduleColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-divider align-top">
                    <td className="break-words px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.role}</td>
                    <td className="px-3 py-2">
                      {r.badge && <StatusBadge status="SCHEDULED" label={t("teachers.panel.substitution")} className="mr-2" />}
                      {r.when}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
        <Section title={t("teachers.panel.upcoming")}>
          {teacher.upcomingClasses.length === 0 ? (
            <p>{t("teachers.panel.noUpcoming")}</p>
          ) : (
            <ul>
              {teacher.upcomingClasses.map((c) => (
                <li key={`${c.classId ?? c.name}-${c.startsAt}`}>
                  {formatDateTime(c.startsAt)} · {c.name}
                  {subs.some((s) => s.classId === c.classId && s.startsAt === c.startsAt) && ` · ${t("teachers.panel.substitutionLower")}`}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <TeacherFormDialog
          open={editing}
          teacher={teacher}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setNotice(t("teachers.form.saved"));
            void onRefresh();
          }}
        />
        <DeactivateTeacherDialog
          teacher={deactivating ? teacher : null}
          onClose={() => setDeactivating(false)}
          onDone={() => {
            setNotice(t("teachers.panel.deactivateDialog.done"));
            void onRefresh();
          }}
        />
        <GrantAccessDialog
          teacher={granting ? teacher : null}
          onClose={() => setGranting(false)}
          onDone={() => {
            setNotice(t("teachers.panel.grant.done"));
            void onRefresh();
          }}
        />
      </div>
    </DrawerShell>
  );
}

function Content() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const api = useTeacher(id);
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
        <EmptyState
          title={t("teachers.panel.notFoundTitle")}
          text={t("teachers.panel.notFoundText")}
          action={
            <Link to="/professores" className="inline-flex min-h-11 items-center underline">
              {t("teachers.panel.back")}
            </Link>
          }
        />
      </DrawerShell>
    );
  }
  if (!api.teacher) {
    return (
      <DrawerShell>
        <ErrorState onRetry={api.retry} />
      </DrawerShell>
    );
  }
  return <Panel teacher={api.teacher} onRefresh={api.refresh} />;
}

// RF-PRO-02: painel em gaveta sobre a lista, com dar acesso e reenviar convite; a barreira de dados é o servidor.
export function TeacherPanelPage() {
  return (
    <TeachersPage>
      <Content />
    </TeachersPage>
  );
}
