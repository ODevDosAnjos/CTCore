import { useTranslation } from "react-i18next";
import { RowCard } from "@/components/query/RowCard";
import { Avatar, Person } from "@/components/ui/avatar";
import { StatusBadge as Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ChargeRow, ChargeSituation } from "./types";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export function StatusBadge({ status }: { status: ChargeSituation }) {
  const { t } = useTranslation();
  return <Badge status={status} label={t(`charges.status.${status}`)} />;
}

export function StudentCell({ row }: { row: Pick<ChargeRow, "student"> }) {
  const { name, photoUrl } = row.student;
  return (
    <span className="flex items-center gap-2">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {initials(name)}
        </span>
      )}
      <span className="min-w-0 break-words font-medium">{name}</span>
    </span>
  );
}

// Referência: mensalidade mostra modalidade e mês (MM/AAAA); as demais, a descrição ou o tipo.
export function useReference() {
  const { t } = useTranslation();
  return (r: ChargeRow) =>
    r.modality && r.referenceMonth
      ? t("charges.reference", { modality: r.modality.name, month: `${r.referenceMonth.slice(5, 7)}/${r.referenceMonth.slice(0, 4)}` })
      : (r.description ?? t(`charges.types.${r.type}`));
}

// Aluno da lista (canvas): foto quando há; sem ela, o avatar colorido de `Person`.
export function ChargeStudent({ row }: { row: Pick<ChargeRow, "student"> }) {
  const { name, photoUrl } = row.student;
  if (!photoUrl) return <Person name={name} size="sm" />;
  return (
    <span className="flex items-center gap-3">
      <img src={photoUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      <span className="min-w-0 truncate text-sm font-medium">{name}</span>
    </span>
  );
}

// Referência em duas linhas (modalidade e mês; embaixo o tipo). É o alvo do teclado que abre o painel (RF-COB-02); o clique na linha faz o mesmo.
export function ReferenceCell({ row, onOpen }: { row: ChargeRow; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const reference = useReference();
  return (
    <button
      type="button"
      aria-label={t("charges.panel.open", { student: row.student.name, reference: reference(row) })}
      className="flex min-h-11 flex-col justify-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onOpen(row.id)}
    >
      <span className="break-words text-sm">{reference(row)}</span>
      <span className="text-xs text-muted-foreground">{t(`charges.types.${row.type}`)}</span>
    </button>
  );
}

// Situação com os dias de atraso embaixo (só em atraso).
export function StatusCell({ row }: { row: ChargeRow }) {
  const { t } = useTranslation();
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <StatusBadge status={row.status} />
      {row.daysLate !== null && <span className="text-xs text-muted-foreground">{t("charges.late", { count: row.daysLate })}</span>}
    </span>
  );
}

// Meio: nome e valor pago ("Pix · R$ 180,90"); sem pagamento, traço.
export function MethodCell({ row }: { row: ChargeRow }) {
  const { t } = useTranslation();
  if (!row.payment) return <>{t("format.empty")}</>;
  return <>{t("charges.methodValue", { method: t(`payments.method.${row.payment.method}`), amount: formatCurrency(row.payment.amountCents) })}</>;
}

// Cartão do celular (canvas): avatar, nome, referência, valor à direita, selo e "venceu dd/mm · N dias".
export function ChargeCard({ row, onOpen }: { row: ChargeRow; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const reference = useReference();
  const day = formatDate(row.dueOn).slice(0, 5);
  return (
    <RowCard
      lead={<Avatar name={row.student.name} decorative />}
      title={
        <button
          type="button"
          aria-label={t("charges.panel.open", { student: row.student.name, reference: reference(row) })}
          className="min-h-11 text-left font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpen(row.id)}
        >
          {row.student.name}
        </button>
      }
      meta={
        <>
          <span>{reference(row)}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={row.status} />
            <span>{row.daysLate !== null ? t("charges.dueLate", { date: day, days: t("charges.late", { count: row.daysLate }) }) : t("charges.dueOn", { date: day })}</span>
          </span>
        </>
      }
      action={<span className="font-medium tabular-nums">{formatCurrency(row.amountCents)}</span>}
    />
  );
}
