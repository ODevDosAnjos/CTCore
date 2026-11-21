import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { PillFilter } from "@/components/ui/pill-filter";
import { useSession } from "@/features/auth/SessionProvider";
import { DEFAULT_TZ, formatCurrency } from "@/lib/format";
import { PortalHeading } from "./PortalHeading";
import { PortalBelts } from "./PortalBelts";
import { PortalChargeCard } from "./PortalChargeCard";
import { PortalFamilyStrip } from "./PortalFamilyStrip";
import { PortalNextLessons } from "./PortalNextLessons";
import { PortalNoticesCard } from "./PortalNoticesCard";
import { usePortalHome, type PortalHomeData } from "./usePortalHome";

const ALL = "all";
const today = () => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: DEFAULT_TZ });
const key = (modality: string, unit: string) => `${modality}|${unit}`;

// RF-POR-02: Início do portal. Cobrança, próximas aulas, avisos e faixa, nesta ordem; o portal reduzido não tem Início e vai ao Financeiro (RN-POR-08).
export function PortalHomePage() {
  const { t } = useTranslation();
  const { state } = useSession();
  const firstName = (state.status === "ready" ? state.session.account.name : null)?.trim().split(" ")[0];
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState(ALL);
  const { status, data, reload } = usePortalHome(selected);
  // A faixa de cartões fica na tela enquanto o cartão novo carrega.
  const [last, setLast] = useState<PortalHomeData>();
  if (data && data !== last) setLast(data);
  const strip = data ?? last;

  const [familyView, setFamilyView] = useState(false);
  const choose = (id: string) => {
    setSelected(id);
    setFilter(ALL);
    setFamilyView(false);
  };

  if (data?.reduced) return <Navigate to="/portal/financeiro" replace />;

  return (
    <>
      <PortalHeading label={today()} title={firstName ? t("portalHome.greeting", { name: firstName }) : t("portalHome.greetingNoName")} />
      <div className="mt-4">
        {strip && strip.students.length > 1 && (
          <PortalFamilyStrip students={strip.students} selected={selected ?? strip.selectedStudentId} familyOpenCents={strip.familyOpenCents} familyView={familyView} onSelect={choose} onFamily={() => setFamilyView(true)} />
        )}
        {familyView && strip ? (
          <Card heading="h2" title={t("portalHome.family.all")}>
            <p className="text-sm text-muted-foreground">{t("portalHome.family.totalText")}</p>
            <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(strip.familyOpenCents)}</p>
            <Link to="/portal/financeiro?visao=familia" className="mt-3 inline-flex min-h-11 items-center underline">
              {t("portalHome.family.seeFinance")}
            </Link>
          </Card>
        ) : status === "loading" || status === "idle" ? (
          <LoadingState variant="card" text={t("portalHome.states.loading")} />
        ) : status === "forbidden" ? (
          <ForbiddenState variant="card" />
        ) : status === "ready" && data ? (
          <Sections data={data} studentId={selected ?? data.selectedStudentId} filter={filter} onFilter={setFilter} reload={reload} />
        ) : (
          <ErrorState variant="card" title={t("portalHome.states.errorTitle")} onRetry={reload} />
        )}
      </div>
    </>
  );
}

function Sections({ data, studentId, filter, onFilter, reload }: { data: PortalHomeData; studentId: string | null; filter: string; onFilter: (v: string) => void; reload: () => void }) {
  const { t } = useTranslation();
  // RN-POR-04: etiqueta e filtro só com mais de uma combinação de modalidade e unidade (a faixa filtra pela modalidade).
  const option = (modality: string, unit: string) => t("portalHome.filter.option", { modality, unit });
  const combos = new Map<string, string>();
  for (const c of data.charges.items) if (c.modality) combos.set(key(c.modality.id, c.unit.id), option(c.modality.name, c.unit.name));
  for (const l of data.lessons) combos.set(key(l.modality.id, l.unit.id), option(l.modality.name, l.unit.name));
  const many = combos.size > 1;
  const active = many && combos.has(filter) ? filter : ALL;
  const fits = (modality: string | undefined, unit: string) => active === ALL || modality === undefined || key(modality, unit) === active;

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
      {many && (
        <div className="md:col-span-2">
          <PillFilter
            label={t("portalHome.filter.label")}
            allLabel={t("portalHome.filter.all")}
            value={active === ALL ? "" : active}
            onChange={(id) => onFilter(id || ALL)}
            options={[...combos].map(([id, name]) => ({ id, name }))}
          />
        </div>
      )}
      <PortalChargeCard items={data.charges.items.filter((c) => fits(c.modality?.id, c.unit.id))} nextDueOn={data.charges.nextDueOn} onChanged={reload} />
      <PortalNextLessons items={data.lessons.filter((l) => fits(l.modality.id, l.unit.id))} />
      <PortalNoticesCard data={data.announcements} />
      <PortalBelts items={data.belts.filter((b) => active === ALL || b.modality.id === active.split("|")[0])} studentId={studentId} />
    </div>
  );
}
