import { Clock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Tabs } from "@/components/ui/tabs";
import { useTabParam } from "@/components/ui/useTabParam";
import { Textarea } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { useTerms, type TermsKind, type TermsVersion } from "./useTerms";
import { PageHeader } from "@/components/ui/page-header";

const KINDS: TermsKind[] = ["ENROLLMENT", "IMAGE_USE"];
const TOOLBAR = ["bold", "italic", "list", "link"] as const;
const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso)) : "");

function History({ versions }: { versions: TermsVersion[] }) {
  const { t } = useTranslation();
  return (
    <Card heading="h2" title={t("terms.history.title")}>
      {versions.length === 0 ? (
        <EmptyState title={t("terms.history.empty")} text={t("terms.history.emptyText")} />
      ) : (
        <div className="overflow-x-auto rounded-card border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">{t("terms.history.version")}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t("terms.history.publishedAt")}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">{t("terms.history.acceptances")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {versions.map((v) => (
                <tr key={v.version}>
                  <td className="px-3 py-3">{v.version}</td>
                  <td className="px-3 py-3">{day(v.publishedAt)}</td>
                  <td className="px-3 py-3 text-right">{v.acceptances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TermEditor({ kind }: { kind: TermsKind }) {
  const { t } = useTranslation();
  const api = useTerms(kind);
  const [text, setText] = useState<string>();
  const [reaccept, setReaccept] = useState<boolean>();
  const [message, setMessage] = useState<{ kind: "status" | "alert"; text: string }>();
  const [busy, setBusy] = useState(false);
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.data) return <ErrorState onRetry={api.retry} />;

  const { canManage, current, versions } = api.data;
  const body = text ?? current.body;
  const next = current.version + 1;
  const changed = body.trim() !== current.body.trim() && body.trim().length > 0;
  const publish = async () => {
    if (reaccept === undefined) return;
    setBusy(true);
    setMessage(undefined);
    try {
      await api.publish({ body, reaccept });
      setText(undefined);
      setReaccept(undefined);
      setMessage({ kind: "status", text: t("terms.published") });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setMessage({ kind: "alert", text: t(status === 409 ? "terms.errors.conflict" : status === 400 ? "terms.errors.invalid" : "terms.errors.generic") });
      if (status === 409) api.retry();
    } finally {
      setBusy(false);
    }
  };
  const line = (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock aria-hidden className="size-3.5 shrink-0" />
      {current.version === 0
        ? t("terms.current.model")
        : t("terms.current.published", { version: current.version, date: day(current.publishedAt), by: current.publishedBy ?? "" })}
    </p>
  );

  return (
    <div className="flex flex-col gap-4">
      {message && <Banner tone={message.kind === "alert" ? "danger" : "ok"}>{message.text}</Banner>}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        {canManage ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void publish();
            }}
          >
            <div className="overflow-hidden rounded-card border bg-card">
              <label htmlFor={`terms-${kind}`} className="sr-only">
                {t("terms.editor.label")}
              </label>
              <div role="toolbar" aria-label={t("terms.editor.toolbar")} className="flex flex-wrap items-center gap-1 border-b bg-muted px-2 py-1 text-xs font-semibold">
                {TOOLBAR.map((k) => (
                  <button key={k} type="button" aria-disabled="true" className="min-h-8 cursor-not-allowed rounded-md px-2 opacity-50">
                    {t(`terms.editor.${k}`)}
                  </button>
                ))}
                <Badge tone="neutral">{t("comingSoon.badge")}</Badge>
              </div>
              <Textarea id={`terms-${kind}`} className="min-h-64 rounded-none border-0 py-3" value={body} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {line}
              <div className="flex flex-wrap items-center gap-2">
                <ComingSoon variant="button" label={t("terms.draft")} />
                <Button type="submit" disabled={busy || !changed || reaccept === undefined}>
                  {t("terms.publish", { version: next })}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            {line}
            <Card heading="h2" title={t("terms.current.title")}>
              <p className="whitespace-pre-wrap break-words">{current.body}</p>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {canManage && (
            <div className="rounded-card border bg-card p-4">
              <ChoiceCards
                legend={t("terms.reaccept.legend", { version: next })}
                value={reaccept === undefined ? "" : reaccept ? "all" : "new"}
                onChange={(v) => setReaccept(v === "all")}
                options={[
                  { value: "new", label: t("terms.reaccept.newOnly"), description: t("terms.reaccept.newOnlyText", { version: current.version }) },
                  { value: "all", label: t("terms.reaccept.everyone"), description: t("terms.reaccept.everyoneText") },
                ]}
              />
            </div>
          )}
          <History versions={versions} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("terms.imageNote")}</p>
    </div>
  );
}

function Content() {
  const { t } = useTranslation();
  const [kind, setKind] = useTabParam<TermsKind>(KINDS);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("terms.title")} subtitle={t("terms.subtitle")} />
      <Tabs
        label={t("terms.tabs")}
        value={kind}
        onValueChange={setKind}
        tabs={KINDS.map((k) => ({ id: k, label: t(`terms.kinds.${k}`), content: <TermEditor key={k} kind={k} /> }))}
      />
    </div>
  );
}

// RF-MAT-05: Coordenador publica; Administrador só consulta (canManage). A barreira de dados é o servidor.
export function TermsPage() {
  return <Content />;
}
