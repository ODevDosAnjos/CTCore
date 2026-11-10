import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { formatPhone } from "@/components/fields/masks";
import { StatusBadge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { ModalityDot } from "@/components/ui/modality-dot";
import type { ChargeList } from "@/features/charges/types";
import { formatCurrency, formatDate } from "@/lib/format";
import type { EnrollmentModality, StudentRecord } from "./types";

function Line({ label, value }: { label: string; value: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{value || t("students.record.summary.none")}</dd>
    </div>
  );
}

const OPEN = ["PENDING", "DUE_TODAY", "OVERDUE"];

// Menor vencimento em aberto: soma e quantidade das cobranças daquele dia (uma por modalidade).
export function nextDue(charges?: ChargeList): { dueOn: string; cents: number; count: number } | null {
  const open = (charges?.items ?? []).filter((c) => OPEN.includes(c.status));
  if (open.length === 0) return null;
  const dueOn = open.map((c) => c.dueOn).sort()[0];
  const same = open.filter((c) => c.dueOn === dueOn);
  return { dueOn, cents: same.reduce((n, c) => n + c.amountCents, 0), count: same.length };
}

// Resumo no desenho do canvas: Modalidades, Contato em grade e ações no rodapé. `charges` e `canCollect` só vêm para quem lê cobranças; `onEdit` só para a gestão.
export function RecordSummary({
  record,
  modalities,
  charges,
  canCollect,
  onEdit,
}: {
  record: StudentRecord;
  modalities?: EnrollmentModality[];
  charges?: ChargeList;
  canCollect?: boolean;
  onEdit?: () => void;
}) {
  const active = (modalities ?? []).filter((m) => m.status === "ACTIVE");
  const { t } = useTranslation();
  const k = "students.record.summary.";
  const a = record.address;
  const e = record.emergency;
  const due = nextDue(charges);
  const phone = (v: string | null | undefined) => (v ? formatPhone(v) : null);
  const emergency = e && [[e.name, e.relationship && `(${e.relationship})`].filter(Boolean).join(" "), phone(e.phone)].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col gap-4">
      {modalities && (
        <Card title={t(`${k}modalities`)}>
          {active.length === 0 ? (
            <p className="text-muted-foreground">{t(`${k}noModalities`)}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2 font-medium">{t(`${k}modalityCol`)}</th>
                  <th className="py-1 pr-2 font-medium">{t(`${k}classCol`)}</th>
                  <th className="py-1 font-medium">{t(`${k}statusCol`)}</th>
                </tr>
              </thead>
              <tbody>
                {active.map((m) => (
                  <tr key={m.id} className="border-t border-divider">
                    <td className="py-2 pr-2">
                      <ModalityDot name={m.modality.name} />
                    </td>
                    <td className="break-words py-2 pr-2">
                      {m.primaryClass.name} · {m.unit.name}
                    </td>
                    <td className="py-2">
                      <StatusBadge status="ACTIVE" label={t(`${k}active`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
      <section aria-labelledby="record-contact">
        <h3 id="record-contact" className="mb-2 text-base font-semibold">
          {t(`${k}contact`)}
        </h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {record.contact && <Line label={t(`${k}phone`)} value={phone(record.contact.phone)} />}
          {record.contact && <Line label={t(`${k}email`)} value={record.contact.email} />}
          {a && <Line label={t(`${k}address`)} value={[[a.street, a.number, a.complement].filter(Boolean).join(", "), a.district, `${a.city}/${a.state}`].join(" · ")} />}
          {e && <Line label={t(`${k}emergencyContact`)} value={emergency} />}
          {canCollect && <Line label={t(`${k}nextDue`)} value={due && t(`${k}nextDueValue`, { count: due.count, date: formatDate(due.dueOn), amount: formatCurrency(due.cents) })} />}
          {onEdit && <Line label={t(`${k}term`)} value={<ComingSoon variant="link" label={t(`${k}termView`)} />} />}
          <Line label={t(`${k}unit`)} value={record.registeredUnit.name} />
          <Line label={t(`${k}ageRange`)} value={record.ageRange?.name} />
          {record.birthDate && <Line label={t(`${k}birthDate`)} value={formatDate(record.birthDate)} />}
        </dl>
        {record.contact?.emailProblem && <p className="mt-1 text-sm text-danger-foreground">{t(`${k}emailProblem`)}</p>}
      </section>
      <Card title={t(`${k}guardians`)}>
        {record.guardians.length === 0 ? (
          <p className="text-muted-foreground">{t(`${k}noGuardians`)}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {record.guardians.map((g) => (
              <li key={g.guardianId} className="break-words">
                <span className="font-medium">{g.name}</span>
                {g.phone && <span className="text-muted-foreground"> · {formatPhone(g.phone)}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {onEdit && (
        <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
          <button type="button" onClick={onEdit} className="min-h-11 text-sm font-medium underline">
            {t(`${k}editData`)}
          </button>
          <ComingSoon variant="link" label={t(`${k}download`)} />
          <ComingSoon variant="link" label={t(`${k}anonymize`)} />
        </div>
      )}
    </div>
  );
}
