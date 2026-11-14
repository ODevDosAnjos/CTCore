import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RowCard } from "@/components/query/RowCard";
import { Avatar, Person } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ChargeActionDialogs, type ChargeDialog } from "./ChargeRowMenu";
import type { ChargeRow, OverdueCharge } from "./types";

// Referência: mensalidade e parcela mostram o tipo e o mês (MM/AAAA); as demais, a descrição ou o tipo.
export function useOverdueReference() {
  const { t } = useTranslation();
  return (r: OverdueCharge) =>
    r.referenceMonth
      ? t("charges.overdue.reference", { type: t(`charges.types.${r.type}`), month: `${r.referenceMonth.slice(5, 7)}/${r.referenceMonth.slice(0, 4)}` })
      : (r.description ?? t(`charges.types.${r.type}`));
}

function useStudentLine(row: OverdueCharge) {
  const { t } = useTranslation();
  const reference = useOverdueReference();
  return t("charges.overdue.studentLine", { modality: row.modality?.name ?? reference(row), unit: row.unit.name });
}

// Aluno com "Modalidade · Unidade" embaixo (a cobrança avulsa mostra o tipo no lugar da modalidade).
export function Student({ row }: { row: OverdueCharge }) {
  return <Person name={row.student.name} size="sm" secondary={useStudentLine(row)} />;
}

export function Select({ row, checked, onToggle }: { row: OverdueCharge; checked: boolean; onToggle: (row: OverdueCharge) => void }) {
  const { t } = useTranslation();
  return <input type="checkbox" className="size-6" aria-label={t("charges.overdue.selectOne", { student: row.student.name })} checked={checked} onChange={() => onToggle(row)} />;
}

export function LateCell({ row }: { row: OverdueCharge }) {
  const { t } = useTranslation();
  return <span className="whitespace-nowrap">{t("charges.overdue.daysLate", { count: row.daysLate })}</span>;
}

// "dd/mm · e-mail", "hoje · e-mail" ou "dd/mm · e-mail com problema" (envio pulado); traço se nunca houve lembrete.
export function LastReminder({ row }: { row: OverdueCharge }) {
  const { t } = useTranslation();
  const last = row.lastReminder;
  if (!last) return <>{t("format.empty")}</>;
  const today = new Date(last.at).toDateString() === new Date().toDateString();
  const what = last.status === "SKIPPED" && last.reason ? t(`charges.overdue.reason.${last.reason}`) : t(`charges.overdue.channel.${last.channel}`);
  return <span className="whitespace-nowrap">{t("charges.overdue.lastReminder", { when: today ? t("charges.overdue.today") : formatDate(last.at).slice(0, 5), what })}</span>;
}

// Bloqueio: "Bloqueada" (0 dia), "Bloqueia em N dias" até 5 dias (cor e texto juntos, nunca só cor), "em N dias" depois, traço sem prazo.
export function BlockCell({ row }: { row: OverdueCharge }) {
  const { t } = useTranslation();
  const days = row.daysToBlock;
  if (days === null) return <>{t("format.empty")}</>;
  if (days === 0) return <Badge tone="danger">{t("charges.overdue.blocked")}</Badge>;
  if (days <= 5) return <Badge tone="danger">{t("charges.overdue.blocksIn", { count: days })}</Badge>;
  return <span className="whitespace-nowrap">{t("charges.overdue.in", { count: days })}</span>;
}

// RN-COM-03: a mensagem é montada aqui e a pessoa envia.
export function useReminderMessage() {
  const { t } = useTranslation();
  return (row: OverdueCharge) =>
    t("charges.overdue.whatsappMessage", { payer: row.payer.name, student: row.student.name, amount: formatCurrency(row.amountCents), due: formatDate(row.dueOn), unit: row.unit.name });
}

// O botão some sem telefone válido ou com o WhatsApp desligado.
export function Whatsapp({ row }: { row: OverdueCharge }) {
  const { t } = useTranslation();
  const message = useReminderMessage();
  return <WhatsAppButton variant="whatsapp" phone={row.payer.phone ?? undefined} message={message(row)} label={t("charges.overdue.actions.remind")} ariaLabel={t("charges.overdue.actions.remindFor", { student: row.student.name })} />;
}

// A cobrança em atraso como linha da lista, para as janelas de Registrar e Renegociar (RN-COB-09: uma cobrança por vez).
const asRow = (r: OverdueCharge): ChargeRow => ({
  id: r.id, student: r.student, unit: r.unit, type: r.type, modality: r.modality, referenceMonth: r.referenceMonth, description: r.description, amountCents: r.amountCents,
  dueOn: r.dueOn, status: "OVERDUE", payment: null, daysLate: r.daysLate,
});

// "Renegociar" na cobrança já bloqueada, "Registrar" nas demais (canvas); ao concluir a lista recarrega.
export function RowActions({ row, onDone }: { row: OverdueCharge; onDone: () => void }) {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<ChargeDialog>();
  const blocked = row.daysToBlock === 0;
  const key = blocked ? "renegotiate" : "register";
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11"
        aria-label={t(`charges.overdue.actions.${key}For`, { student: row.student.name })}
        onClick={(e) => {
          e.stopPropagation();
          setDialog(blocked ? "renegotiate" : "pay");
        }}
      >
        {t(`charges.overdue.actions.${key}`)}
      </Button>
      {/* Os eventos da janela sobem pela árvore do React até a linha (que escolhe a mensagem): este invólucro os segura. */}
      <div hidden onClick={(e) => e.stopPropagation()}>
        <ChargeActionDialogs row={asRow(row)} dialog={dialog} onClose={() => setDialog(undefined)} onDone={onDone} />
      </div>
    </>
  );
}

// Cartão do celular: mesma informação e mesmas ações da tabela, em pilha.
export function OverdueCard({ row, checked, onToggle, onDone }: { row: OverdueCharge; checked: boolean; onToggle: (row: OverdueCharge) => void; onDone: () => void }) {
  const { t } = useTranslation();
  const line = useStudentLine(row);
  return (
    <RowCard
      lead={
        <>
          <span className="flex min-h-11 items-center">
            <Select row={row} checked={checked} onToggle={onToggle} />
          </span>
          <Avatar name={row.student.name} decorative />
        </>
      }
      title={row.student.name}
      meta={
        <>
          <span>{line}</span>
          <span className="flex flex-wrap items-center gap-x-2">
            <LateCell row={row} />
            <span className="tabular-nums">{formatCurrency(row.amountCents)}</span>
          </span>
          <span>
            {t("charges.overdue.columns.lastReminder")}: <LastReminder row={row} />
          </span>
          <span>
            {t("charges.overdue.columns.block")}: <BlockCell row={row} />
          </span>
          <span className="mt-2 flex flex-wrap gap-2">
            <Whatsapp row={row} />
            <RowActions row={row} onDone={onDone} />
          </span>
        </>
      }
    />
  );
}
