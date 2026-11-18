import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AnnouncementPreview } from "./types";

export type PreviewState = { status: "loading" } | { status: "error" } | { status: "ready"; data: AnnouncementPreview };

const EXCERPT = 60;

function Line({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" />
      <span>{children}</span>
    </li>
  );
}

// RN-COM-09: coluna "Prévia" do formulário: para quem vai (alunos, adultos e responsáveis, portal e e-mail) e como aparece no portal.
// A linha de modalidade bloqueada só existe na Sprint 12 (RN-COM-02). `actions` são os botões do pé da coluna.
export function AnnouncementPreviewPanel({ state, title, body, actions }: { state: PreviewState | null; title: string; body: string; actions: ReactNode }) {
  const { t } = useTranslation();
  const p = state?.status === "ready" ? state.data : null;
  const off = p ? Math.max(p.portal - p.email, 0) : 0;
  const excerpt = body.length > EXCERPT ? `${body.slice(0, EXCERPT).trimEnd()}…` : body;
  const label = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
  return (
    <aside aria-label={t("announcements.new.previewLabel")} className="flex flex-col gap-4 rounded-card border bg-card p-6 md:sticky md:top-4">
      <h2 className="font-heading text-lg font-semibold">{t("announcements.new.previewLabel")}</h2>
      <section aria-label={t("announcements.new.previewWho")} role="status" className="flex flex-col gap-2 rounded-md bg-surface-soft p-3 text-sm">
        <h3 className={label}>{t("announcements.new.previewWho")}</h3>
        {!state && <p className="text-muted-foreground">{t("announcements.new.previewPick")}</p>}
        {state?.status === "loading" && <p>{t("announcements.new.previewLoading")}</p>}
        {state?.status === "error" && <p className="text-danger-foreground">{t("announcements.new.previewError")}</p>}
        {p && (
          <ul className="flex flex-col gap-2">
            <Line>
              <strong>{t("announcements.new.previewCount", { count: p.recipients })}</strong> {t("announcements.new.previewSplit", { adults: p.adults, guardians: p.guardians })}
            </Line>
            <Line>
              {t("announcements.new.previewDelivery", { portal: p.portal, email: p.email })}
              {off > 0 && ` ${t("announcements.new.previewOff", { count: off })}`}
            </Line>
            {p.whatsapp && <Line>{t(`announcements.new.previewWhatsapp.${p.whatsapp.mode}`)}</Line>}
          </ul>
        )}
      </section>
      <section aria-label={t("announcements.new.previewAsShown")} className="flex flex-col gap-1 rounded-md border p-3 text-sm">
        <h3 className="text-xs text-muted-foreground">{t("announcements.new.previewAsShown")}</h3>
        <p className="font-semibold">{title || t("announcements.new.previewNoTitle")}</p>
        {excerpt && <p className="whitespace-pre-line text-muted-foreground">{excerpt}</p>}
      </section>
      <div className="flex flex-col items-stretch gap-2 [&>button]:w-full [&>span]:justify-center">{actions}</div>
    </aside>
  );
}
