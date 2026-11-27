import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { ChooseLinkTrigger } from "@/features/auth/ChooseLinkTrigger";
import { useSession } from "@/features/auth/SessionProvider";
import { formatDate } from "@/lib/format";

const WITH_UNITS = ["ADMINISTRATOR", "TEACHER"];
const list = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  );
}

// RF-ACE-05, D4: todos os vínculos ativos da conta, só para leitura; os dados vêm da sessão (sem carga própria).
export function MyLinks({ portal }: { portal: boolean }) {
  const { t } = useTranslation();
  const { state } = useSession();
  if (state.status !== "ready") return null;
  const title = t("account.profile.links");
  return (
    <Card heading="h2" title={title} titleClassName={portal ? CARD_TITLE : undefined} actions={<ChooseLinkTrigger />}>
      <ul aria-label={title} className="divide-y">
        {state.session.links.map((l) => (
          <li key={l.id} className="space-y-2 py-3">
            <p className="break-words font-semibold">{l.organizationName}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label={t("account.profile.role")} value={t(`chooseLink.roles.${l.role}`)} />
              {WITH_UNITS.includes(l.role) && !!l.unitNames?.length && <Info label={t("account.profile.units")} value={list.format(l.unitNames)} />}
              {l.role === "GUARDIAN" && !!l.studentNames?.length && <Info label={t("account.profile.students")} value={list.format(l.studentNames)} />}
              {l.startsOn && <Info label={t("account.profile.since")} value={formatDate(l.startsOn)} />}
            </dl>
          </li>
        ))}
      </ul>
    </Card>
  );
}
