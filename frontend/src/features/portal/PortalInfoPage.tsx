import { useState } from "react";
import { Download, FileText, KeyRound, Mail, Smartphone, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PortalGraduation } from "./PortalGraduation";
import { PortalHeading } from "./PortalHeading";
import { DisclosureRow, LinkRow, MenuList, SoonRow } from "./PortalMenuRows";
import { PortalPersonalData, PortalPhoto } from "./PortalPersonalData";
import { PortalAccountCard, PortalPreferences, PortalRequestsSummary, PortalTermsAccepted } from "./PortalSettings";
import { PortalTrainings, PortalUnitContacts } from "./PortalTrainings";
import { usePortalInfo, type PortalInfoData } from "./usePortalInfo";

function Sections({ info, reload, narrow }: { info: PortalInfoData; reload: () => void; narrow: boolean }) {
  const { t } = useTranslation();
  const id = info.selectedStudentId;
  const personal = <PortalPersonalData studentId={id} personal={info.personal} onChanged={reload} />;
  const terms = <PortalTermsAccepted studentId={id} terms={info.terms} onChanged={reload} />;
  if (narrow && !info.reduced)
    return (
      <div className="flex flex-col gap-3">
        <PortalPhoto studentId={id} personal={info.personal} onChanged={reload} compact />
        <PortalPersonalData studentId={id} personal={info.personal} onChanged={reload} compact />
        <PortalTrainings items={info.trainings} plans={info.plans} />
        <MenuList label={t("portalInfo.menu.label")}>
          <DisclosureRow icon={FileText} label={t("portalInfo.menu.terms")}>
            {terms}
          </DisclosureRow>
          <DisclosureRow icon={Mail} label={t("portalInfo.menu.preferences")}>
            <PortalPreferences initial={info.emailAnnouncements} />
          </DisclosureRow>
          <LinkRow icon={KeyRound} to="/conta" label={t("portalInfo.account.mine")} />
          <SoonRow icon={Download} label={t("portalInfo.account.download")} />
          <SoonRow icon={Trash2} label={t("portalInfo.account.delete")} />
          <SoonRow icon={Smartphone} label={t("portalInfo.account.install")} />
        </MenuList>
        {info.trainings.length > 0 && <PortalGraduation items={info.graduation} />}
        <PortalRequestsSummary studentId={id} />
      </div>
    );
  if (info.reduced)
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          {personal}
          <PortalUnitContacts units={info.unitContacts} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <PortalPreferences initial={info.emailAnnouncements} />
          {terms}
          <PortalAccountCard reduced />
        </div>
        <p className="text-sm text-muted-foreground">{t("portalInfo.reducedNote")}</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4 max-lg:order-2">{personal}</div>
        <div className="flex flex-col gap-4 max-lg:contents">
          <div className="max-lg:order-1">
            <PortalPhoto studentId={id} personal={info.personal} onChanged={reload} />
          </div>
          <div className="max-lg:order-3">{terms}</div>
        </div>
      </div>
      <PortalTrainings items={info.trainings} plans={info.plans} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <PortalPreferences initial={info.emailAnnouncements} />
        <PortalAccountCard />
      </div>
      {info.trainings.length > 0 && <PortalGraduation items={info.graduation} />}
      <PortalRequestsSummary studentId={id} />
    </div>
  );
}

// RF-POR-07: aba Minhas informações do aluno escolhido em `?aluno=` (padrão o primeiro cartão). Fora de RequireFullPortal: o portal reduzido também a vê (RN-INA-08).
export function PortalInfoPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const student = params.get("aluno");
  const { status, data, reload } = usePortalInfo(student);
  const narrow = useBelowSm();
  // Os chips ficam na tela enquanto os dados do aluno novo carregam.
  const [last, setLast] = useState<PortalInfoData>();
  if (data && data !== last) setLast(data);
  const list = data ?? last;
  const current = student ?? list?.selectedStudentId;
  const name = list?.students.find((s) => s.id === current)?.name ?? list?.personal.name;
  return (
    <>
      <PortalHeading className="mb-4" label={t("portalInfo.label")} title={narrow && !list?.reduced ? t("portalInfo.mobileTitle") : (name ?? t("portalInfo.title"))} />
      {list && list.students.length > 1 && (
        <div role="group" aria-label={t("portalInfo.selector")} className="mb-4 flex flex-wrap gap-2">
          {list.students.map((s) => {
            const on = s.id === current;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => setParams({ aluno: s.id }, { replace: true })}
                className={cn(
                  "relative inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm after:absolute after:left-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "border-primary bg-primary/10 font-medium" : "border-input bg-card hover:bg-surface-soft",
                )}
              >
                <Avatar name={s.name} decorative size="sm" className="size-6 text-[10px]" />
                {s.self ? t("portalInfo.you") : s.name}
              </button>
            );
          })}
        </div>
      )}
      {status === "loading" ? (
        <LoadingState />
      ) : status === "forbidden" ? (
        <ForbiddenState />
      ) : status === "ready" && data ? (
        <Sections key={data.selectedStudentId} info={data} reload={reload} narrow={narrow} />
      ) : (
        <ErrorState onRetry={reload} />
      )}
    </>
  );
}
