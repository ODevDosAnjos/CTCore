import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PortalHeading } from "./PortalHeading";
import { PortalLayout } from "./PortalLayout";
import { PortalMemberCard } from "./PortalMemberCard";
import { usePortalCard, type PortalCardData } from "./usePortalCard";

// Um cartão do modo responsável: uma leitura por aluno (D5).
function FamilyCard({ id }: { id: string }) {
  const { status, data, reload } = usePortalCard(id);
  return (
    <div className="w-full md:w-[420px]">
      {status === "loading" ? <LoadingState /> : status === "forbidden" ? <ForbiddenState /> : status === "ready" && data ? <PortalMemberCard data={data} compact /> : <ErrorState onRetry={reload} />}
    </div>
  );
}

// RF-POR-03: carteirinha do aluno escolhido em `?aluno=` (padrão o primeiro cartão). Fica fora de RequireFullPortal: o inativo e o ex-aluno também a veem (RN-INA-08).
// Responsável com mais de um aluno vê um cartão por aluno; o chip filtra e, acionado de novo, volta a mostrar todos (D5).
export function PortalCardPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const hasHistory = useLocation().key !== "default";
  const narrow = useBelowSm();
  const student = params.get("aluno");
  const { status, data, offline, reload } = usePortalCard(student);
  // Os chips ficam na tela enquanto a leitura nova carrega.
  const [last, setLast] = useState<PortalCardData>();
  if (data && data !== last) setLast(data);
  const list = data ?? last;
  const family = !!list && list.students.length > 1;
  const back = (
    <Button variant="ghost" onClick={() => (hasHistory ? navigate(-1) : navigate("/portal/minhas-informacoes"))} className={cn(narrow && "-ml-3 mb-2 text-muted-foreground")}>
      {narrow && <ChevronLeft aria-hidden className="size-4" />}
      {t("portalCard.back")}
    </Button>
  );
  const ids = family ? (student ? [student] : list.students.map((s) => s.id)) : [];
  return (
    <PortalLayout>
      {offline && data && (
        <Banner tone="warn" className="mb-4">
          {t("portalCard.offlineBanner", { date: formatDateTime(data.generatedAt, data.timezone) })}
        </Banner>
      )}
      {narrow && back}
      <PortalHeading
        label={t(family ? "portalCard.familyLabel" : "portalCard.label")}
        title={t(family ? "portalCard.familyTitle" : "portalCard.title")}
        subtitle={family ? t("portalCard.familyText") : undefined}
        className="mb-4"
      />
      {family && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {list.students.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={student === s.id}
                onClick={() => setParams(student === s.id ? {} : { aluno: s.id }, { replace: true })}
                className={cn("flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium", student === s.id ? "border-primary bg-card" : "bg-secondary")}
              >
                <Avatar name={s.name} decorative size="sm" />
                {s.self ? t("portalCard.you") : s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {family ? (
        <div className="flex flex-wrap gap-6">
          {ids.map((id) => (
            <FamilyCard key={id} id={id} />
          ))}
        </div>
      ) : status === "loading" ? (
        <LoadingState />
      ) : status === "forbidden" ? (
        <ForbiddenState />
      ) : status === "ready" && data ? (
        <div className="grid items-center gap-6 lg:grid-cols-[440px_1fr] lg:gap-12">
          <PortalMemberCard data={data} />
          <div className="flex flex-col items-start gap-4">
            <p className="max-w-sm">{offline ? t("portalCard.offlineText") : t(narrow ? "portalCard.receptionMobile" : "portalCard.reception")}</p>
            {!narrow && !offline && <p className="max-w-sm text-sm text-muted-foreground">{t("portalCard.installedNote")}</p>}
            <div className="flex items-center gap-2">
              <ComingSoon variant="button" label={t("portalCard.download")} />
              {!narrow && back}
            </div>
          </div>
        </div>
      ) : (
        <ErrorState onRetry={reload} />
      )}
    </PortalLayout>
  );
}
