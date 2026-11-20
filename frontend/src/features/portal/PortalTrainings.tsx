import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CARD_TITLE, Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp";
import { formatCurrency, formatDate, formatPhoneDisplay } from "@/lib/format";
import type { InfoClass, InfoPlan, InfoTraining, InfoUnit } from "./usePortalInfo";

// RF-POR-07, RN-POR-06: contato da academia (da unidade, nunca do professor). No portal reduzido é o que resta no lugar dos treinos.
export function PortalUnitContacts({ units }: { units: InfoUnit[] }) {
  const { t } = useTranslation();
  const k = "portalInfo.units.";
  if (units.length === 0) return null;
  return (
    <Card heading="h2" title={t(`${k}title`)}>
      <ul className="flex flex-col gap-4">
        {units.map((u) => (
          <li key={u.id} className="flex flex-col gap-3">
            <dl className="flex flex-col gap-2 text-sm">
              {units.length > 1 && <dt className="break-words font-medium">{u.name}</dt>}
              {[
                [t(`${k}phone`), u.phone],
                [t(`${k}whatsapp`), u.whatsapp],
                [t(`${k}email`), u.email],
              ]
                .filter((i): i is [string, string] => !!i[1])
                .map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="break-words">{label === t(`${k}email`) ? value : formatPhoneDisplay(value)}</dd>
                  </div>
                ))}
            </dl>
            {u.whatsapp && <WhatsAppButton phone={u.whatsapp} variant="whatsapp" label={t(`${k}whatsappButton`)} ariaLabel={t(`${k}whatsappButton`)} className="w-full" />}
          </li>
        ))}
      </ul>
    </Card>
  );
}

type Row = { training: InfoTraining; plan: InfoPlan | undefined };

const dash = "—";

// RF-POR-07, RN-POR-07, RN-POR-09: por modalidade, turma principal, outros horários, plano, mensalidade e situação; sem presença, frequência nem progresso.
export function PortalTrainings({ items, plans }: { items: InfoTraining[]; plans: InfoPlan[] }) {
  const { t } = useTranslation();
  const k = "portalInfo.trainings.";
  const narrow = useBelowSm();
  const rows: Row[] = items.map((training) => ({ training, plan: plans.find((p) => p.modality.id === training.modality.id) }));

  // Dias com o mesmo horário juntos: "Seg, Qua e Sex 19:30".
  const slots = (c: InfoClass) => {
    if (c.schedule.length === 0) return t(`${k}noSchedule`);
    const groups = new Map<string, string[]>();
    for (const s of c.schedule) groups.set(s.startsAt, [...(groups.get(s.startsAt) ?? []), t(`agenda.weekdays.${s.weekday}`)]);
    return [...groups].map(([from, days]) => t(`${k}slot`, { days: days.length > 1 ? `${days.slice(0, -1).join(", ")} e ${days[days.length - 1]}` : days[0], from })).join(", ");
  };
  const main = (r: Row) => t(`${k}mainLine`, { name: r.training.mainClass.clazz.name, slots: slots(r.training.mainClass), teacher: r.training.mainClass.teacherName });
  const others = (r: Row) => (r.training.otherClasses.length === 0 ? dash : r.training.otherClasses.map((c) => t(`${k}otherLine`, { name: c.clazz.name, slots: slots(c) })).join("; "));
  const benefit = (p: InfoPlan) =>
    p.benefit
      ? [
          p.benefit.type === "PERCENT" ? t(`${k}benefitPercent`, { value: p.benefit.value }) : t(`${k}benefitAmount`, { value: formatCurrency(p.benefit.value) }),
          p.benefit.validUntil ? t(`${k}benefitUntil`, { date: formatDate(p.benefit.validUntil) }) : "",
        ]
          .filter(Boolean)
          .join(" ")
      : t(`${k}noBenefit`);
  const plan = (r: Row) => (r.plan ? `${t(`${k}planLine`, { plan: r.plan.plan.name, value: formatCurrency(r.plan.planCents) })} · ${benefit(r.plan)}` : dash);
  const monthly = (r: Row) => (r.plan ? t(`${k}monthlyLine`, { value: formatCurrency(r.plan.monthlyCents), day: r.plan.dueDay }) : dash);
  const status = <Badge tone="ok">{t(`${k}active`)}</Badge>;
  const name = (r: Row) => r.training.modality.name;

  const columns: Column<Row>[] = [
    { key: "modality", label: t(`${k}modality`), render: (r) => <span className="font-medium">{name(r)}</span> },
    { key: "main", label: t(`${k}main`), render: main },
    { key: "others", label: t(`${k}others`), render: others },
    { key: "plan", label: t(`${k}plan`), render: plan },
    { key: "monthly", label: t(`${k}monthly`), render: monthly },
    { key: "status", label: t(`${k}status`), render: () => status },
  ];
  const make = (
    <Button asChild variant="secondary" size={narrow ? "md" : "sm"} className={narrow ? "mt-3 w-full" : undefined}>
      <Link to="/portal/pedidos">
        <Plus aria-hidden />
        {t(`${k}make`)}
      </Link>
    </Button>
  );
  return (
    <Card heading="h2" title={t(`${k}title`)} titleClassName={narrow ? CARD_TITLE : undefined} actions={!narrow && make}>
      {items.length === 0 ? (
        <EmptyState title={t("portalInfo.emptyTitle")} text={t("portalInfo.emptyText")} />
      ) : narrow ? (
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.training.modality.id + r.training.unit.id} className="py-3 first:pt-0 last:pb-0">
              <RowCard title={name(r)} meta={<><span>{main(r)}</span>{r.training.otherClasses.length > 0 && <span>{others(r)}</span>}<span>{plan(r)}</span><span>{monthly(r)}</span></>} badge={status} />
            </li>
          ))}
        </ul>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.training.modality.id + r.training.unit.id} order="" onOrder={() => {}} />
      )}
      {narrow && make}
      {items.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{t(`${k}changeHint`)}</p>}
    </Card>
  );
}
