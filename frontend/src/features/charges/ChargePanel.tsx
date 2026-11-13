import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Drawer } from "@/components/ui/drawer";
import { formatCurrency, formatDate, formatDateTime, relativeDay } from "@/lib/format";
import { StatusBadge, useReference } from "./ChargeCards";
import { CancelChargeDialog } from "./CancelChargeDialog";
import { RegisterPaymentDialog } from "@/features/payments/RegisterPaymentDialog";
import { receiptStaffPdfUrl } from "@/features/payments/usePayment";
import { RenegotiateDialog } from "./RenegotiateDialog";
import { SendReminderDialog } from "./SendReminderDialog";
import type { ChargeDetail, ChargeRef, ChargeReminder } from "./types";
import { useChargeDetail } from "./useChargeActions";

const TH = "px-3 py-2 text-left text-xs font-semibold text-muted-foreground";
const TD = "px-3 py-2.5 align-top";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Table({ label, head, children }: { label: string; head: { text: string; right?: boolean }[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-sm" aria-label={label}>
        <thead className="bg-surface-soft">
          <tr>
            {head.map((h) => (
              <th key={h.text} scope="col" className={`${TH} ${h.right ? "text-right" : ""}`}>
                {h.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">{children}</tbody>
      </table>
    </div>
  );
}

function Refs({ refs }: { refs: ChargeRef[] }) {
  const { t } = useTranslation();
  return (
    <ul className="text-sm">
      {refs.map((r) => (
        <li key={r.id}>{t("charges.panel.ref", { type: t(`charges.types.${r.type}`), amount: formatCurrency(r.amountCents), due: formatDate(r.dueOn), status: t(`charges.stored.${r.status}`) })}</li>
      ))}
    </ul>
  );
}

// Lembrete: o automático diz quantos dias antes ou depois do vencimento foi enviado; o aviso de bloqueio e o manual dizem o que são.
function reminderKind(t: (k: string, o?: Record<string, unknown>) => string, r: ChargeReminder, dueOn: string) {
  if (r.kind === "BLOCK_WARNING") return t("charges.panel.reminderKind.BLOCK_WARNING");
  if (r.kind === "MANUAL") return t("charges.panel.reminderKind.MANUAL", { name: r.sentBy?.name ?? t("format.empty") });
  const before = relativeDay(r.createdAt, dueOn) ?? 0;
  return before > 0 ? t("charges.panel.reminderKind.before", { count: before }) : before < 0 ? t("charges.panel.reminderKind.after", { count: -before }) : t("charges.panel.reminderKind.today");
}

function Body({ d }: { d: ChargeDetail }) {
  const { t } = useTranslation();
  const { charge, composition } = d;
  const h = d.origin || d.replacedBy.length > 0 || d.reason || d.canceledAt;
  return (
    <div className="flex flex-col gap-6">
      {charge.status === "IN_REVIEW" && (
        <p className="flex flex-col items-start text-sm">
          {t("charges.panel.disabled.inReview")}
          <Link to="/cobrancas/conferencia" className="inline-flex min-h-11 items-center underline">
            {t("charges.quick.openReview")}
          </Link>
        </p>
      )}

      <Block title={t("charges.panel.composition")}>
        <Table label={t("charges.panel.composition")} head={[{ text: t("charges.panel.item") }, { text: t("charges.panel.value"), right: true }]}>
          <tr>
            <td className={`${TD} break-words`}>{composition.plan?.name ?? t("format.empty")}</td>
            <td className={`${TD} text-right tabular-nums`}>{composition.plan ? formatCurrency(composition.planCents) : t("format.empty")}</td>
          </tr>
          <tr>
            <td className={TD}>{t("charges.panel.benefit")}</td>
            <td className={`${TD} text-right tabular-nums`}>{composition.benefitCents > 0 ? `− ${formatCurrency(composition.benefitCents)}` : t("format.empty")}</td>
          </tr>
          <tr className="font-semibold">
            <td className={TD}>{t("charges.panel.final")}</td>
            <td className={`${TD} text-right tabular-nums`}>{formatCurrency(composition.amountCents)}</td>
          </tr>
        </Table>
        <p className="text-xs text-muted-foreground">{t("charges.panel.compositionNote", { due: formatDate(charge.dueOn), created: formatDate(d.createdOn) })}</p>
      </Block>

      {h && (
        <Block title={t("charges.panel.history")}>
          <div className="flex flex-col gap-2 rounded-md border bg-card p-3">
            {d.origin && (
              <>
                <p className="text-sm text-muted-foreground">{t("charges.panel.origin")}</p>
                <Refs refs={[d.origin]} />
              </>
            )}
            {d.replacedBy.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">{t("charges.panel.replacedBy")}</p>
                <Refs refs={d.replacedBy} />
              </>
            )}
            {d.reason && <p className="break-words text-sm">{t("charges.panel.reason", { reason: d.reason })}</p>}
            {d.canceledAt && <p className="text-sm">{t("charges.panel.canceled", { at: formatDateTime(d.canceledAt), by: d.canceledBy?.name ?? t("format.empty") })}</p>}
          </div>
        </Block>
      )}

      <Block title={t("charges.panel.payments")}>
        {d.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("charges.panel.noPayments")}</p>
        ) : (
          <Table
            label={t("charges.panel.payments")}
            head={[{ text: t("charges.panel.when") }, { text: t("charges.panel.method") }, { text: t("charges.panel.value"), right: true }, { text: t("charges.panel.receiptColumn") }]}
          >
            {d.payments.map((p) => (
              <tr key={p.id}>
                <td className={TD}>{formatDateTime(p.paidAt)}</td>
                <td className={`${TD} break-words`}>
                  {t(`payments.method.${p.method}`)}
                  {p.observation && <span className="text-muted-foreground"> · {p.observation}</span>}
                  <span className="block text-xs text-muted-foreground">{t("charges.panel.registeredBy", { name: p.registeredBy?.name ?? t(`charges.panel.origins.${p.origin}`) })}</span>
                  {p.status === "REFUNDED" && <span className="block text-xs">{t("charges.status.REFUNDED")}</span>}
                </td>
                <td className={`${TD} text-right tabular-nums`}>{formatCurrency(p.amountCents)}</td>
                <td className={TD}>
                  {p.receipt ? (
                    <a className="whitespace-nowrap text-danger-foreground underline" href={receiptStaffPdfUrl(p.receipt.code)} target="_blank" rel="noreferrer" title={t("charges.panel.receiptCode", { code: p.receipt.code })}>
                      {t("charges.panel.receiptLink", { number: String(p.receipt.number).padStart(4, "0") })}
                    </a>
                  ) : (
                    t("format.empty")
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Block>

      <Block title={t("charges.panel.reminders")}>
        {d.reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("charges.panel.noReminders")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-divider text-sm">
            {d.reminders.map((r, i) => (
              <li key={i} className="flex gap-3 py-2.5">
                <span className="w-10 shrink-0 text-muted-foreground">{formatDate(r.createdAt).slice(0, 5)}</span>
                <span className="min-w-0 break-words">
                  {t("charges.panel.reminderLine", {
                    kind: reminderKind(t, r, charge.dueOn),
                    channel: t(`charges.reminder.channel.${r.channel}`),
                  })}
                  {r.status === "SKIPPED" && ` · ${t(`charges.reminder.status.${r.reason ?? r.status}`)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );
}

type Open = (dialog: "cancel" | "renegotiate" | "pay" | "remind") => void;

// Ações que o servidor libera (`actions`); a desabilitada leva o motivo escrito (ver `Footer`).
function SecondaryActions({ d, studentLink, open, narrow }: { d: ChargeDetail; studentLink: boolean; open: Open; narrow: boolean }) {
  const { t } = useTranslation();
  const { charge, actions } = d;
  const full = narrow ? "w-full" : "";
  return (
    <>
      <Button type="button" variant="secondary" className={`min-h-11 ${full}`} disabled={!actions.sendReminder} aria-describedby={actions.sendReminder ? undefined : "why-sendReminder"} onClick={() => open("remind")}>
        {t("charges.panel.sendReminder")}
      </Button>
      {actions.renegotiate && (
        <Button type="button" variant="secondary" className={`min-h-11 ${full}`} onClick={() => open("renegotiate")}>
          {t("charges.panel.renegotiate")}
        </Button>
      )}
      {studentLink && (
        <Button asChild variant="ghost" className={`min-h-11 ${full}`}>
          <Link to={`/alunos/${charge.student.id}`}>{t("charges.panel.seeStudent")}</Link>
        </Button>
      )}
      <ComingSoon variant="button" label={t("charges.panel.refund")} className="min-h-11 w-full sm:w-auto" />
      {actions.cancel && (
        <Button type="button" variant="danger" className={`min-h-11 ${narrow ? "w-full" : "sm:ml-auto"}`} onClick={() => open("cancel")}>
          {t("charges.panel.cancel")}
        </Button>
      )}
    </>
  );
}

// R3: no celular só "Registrar pagamento" fica fixo ao pé; as demais ações seguem no fim do conteúdo.
function Footer({ d, studentLink, open, narrow }: { d: ChargeDetail; studentLink: boolean; open: Open; narrow: boolean }) {
  const { t } = useTranslation();
  const { actions } = d;
  // Ação que o servidor não libera: botão desabilitado e o motivo escrito logo acima.
  const reasons = (["registerPayment", "sendReminder"] as const).filter((k) => !actions[k]);
  return (
    <div className="flex w-full flex-col gap-2">
      {reasons.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {reasons.map((k) => (
            <li key={k} id={`why-${k}`}>
              {t(`charges.panel.disabled.${k}`)}
            </li>
          ))}
        </ul>
      )}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="button" className="min-h-11" disabled={!actions.registerPayment} aria-describedby={actions.registerPayment ? undefined : "why-registerPayment"} onClick={() => open("pay")}>
          {t("charges.panel.registerPayment")}
        </Button>
        {!narrow && <SecondaryActions d={d} studentLink={studentLink} open={open} narrow={false} />}
      </div>
    </div>
  );
}

// RF-COB-02: painel da cobrança em gaveta (tela cheia no celular). O servidor decide o que cada perfil vê e quais ações valem (`actions`).
export function ChargePanel({ id, onClose, onChanged, studentLink = true }: { id: string; onClose: () => void; onChanged?: () => void; studentLink?: boolean }) {
  const { t } = useTranslation();
  const reference = useReference();
  const narrow = useBelowSm();
  const { status, data, reload } = useChargeDetail(id);
  const [dialog, setDialog] = useState<"cancel" | "renegotiate" | "pay" | "remind">();
  const [paid, setPaid] = useState(false);
  const done = () => {
    reload();
    onChanged?.();
  };

  let body: ReactNode;
  if (status === "loading") body = <LoadingState />;
  else if (status === "forbidden") body = <ForbiddenState />;
  else if (status === "notFound") body = <EmptyState title={t("charges.panel.notFound")} text={t("charges.panel.notFoundText")} />;
  else if (status === "error" || !data) body = <ErrorState onRetry={reload} />;
  else
    body = (
      <>
        <Body d={data} />
        {narrow && (
          <div className="mt-6 flex flex-col gap-2">
            <SecondaryActions d={data} studentLink={studentLink} open={setDialog} narrow />
          </div>
        )}
      </>
    );

  const charge = data?.charge;
  const payer = data && (data.payer.kind === "STUDENT" ? t("charges.panel.payerSelf") : data.payer.name);
  return (
    <>
      <Drawer
        open
        onOpenChange={(open) => !open && onClose()}
        title={charge ? reference(charge) : t("charges.panel.title")}
        mobileTitle={t("charges.panel.title")}
        eyebrow={
          charge && (
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-[22px] items-center rounded-full bg-surface-soft px-2 text-xs font-medium text-foreground">{t(`charges.types.${charge.type}`)}</span>
              <StatusBadge status={charge.status} />
            </span>
          )
        }
        subtitle={
          charge &&
          data && (
            <div className="flex items-center gap-2">
              <Avatar name={charge.student.name} decorative size="sm" />
              <div className="flex flex-col">
                <span className="break-words text-sm font-medium">{charge.student.name}</span>
                <span className="break-words text-xs text-muted-foreground">{t("charges.panel.subtitle", { unit: charge.unit.name, payer })}</span>
              </div>
            </div>
          )
        }
        footer={data && <Footer d={data} studentLink={studentLink} open={setDialog} narrow={narrow} />}
      >
        {body}
      </Drawer>
      {data && dialog === "cancel" && <CancelChargeDialog charge={data.charge} onClose={() => setDialog(undefined)} onDone={done} />}
      {data && dialog === "pay" && (
        <RegisterPaymentDialog
          chargeId={data.charge.id}
          charge={{ student: data.charge.student.name, label: reference(data.charge), dueOn: data.charge.dueOn, unitName: data.charge.unit.name }}
          amountCents={data.charge.amountCents}
          payerEmail={data.payer.email}
          onPaid={() => setPaid(true)}
          onClose={() => {
            setDialog(undefined);
            if (paid) done();
          }}
        />
      )}
      {data && dialog === "remind" && <SendReminderDialog targets={[{ id: data.charge.id, label: reference(data.charge) }]} onClose={() => setDialog(undefined)} onDone={done} />}
      {data && dialog === "renegotiate" && <RenegotiateDialog charge={data.charge} onClose={() => setDialog(undefined)} onDone={done} />}
    </>
  );
}
