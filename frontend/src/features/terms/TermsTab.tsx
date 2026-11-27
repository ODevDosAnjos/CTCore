import { Clock } from "lucide-react";
import { useRef, useState } from "react";
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
import { Field, Select, Textarea } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { useTerms, type TermsKind, type TermsUnitPreview, type TermsVersion } from "./useTerms";

const KINDS: TermsKind[] = ["ENROLLMENT", "IMAGE_USE"];
// RN-MAT-21: os campos automáticos do termo de matrícula (os mesmos do servidor).
const FIELDS = ["unidade", "razao_social", "cnpj", "endereco"] as const;
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

// Prévia por unidade (RN-MAT-21): os valores vêm prontos do servidor; a tela só troca os campos, em uma passada.
function Preview({ text, units }: { text: string; units: TermsUnitPreview[] }) {
  const { t } = useTranslation();
  const [unitId, setUnitId] = useState<string>();
  const unit = units.find((u) => u.id === unitId) ?? units[0];
  return (
    <Card heading="h2" title={t("terms.preview.title")}>
      {!unit ? (
        <p className="text-sm text-muted-foreground">{t("terms.preview.empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label={t("terms.preview.unit")}>
            {(control) => (
              <Select {...control} value={unit.id} onChange={(e) => setUnitId(e.target.value)}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {unit.missing.length > 0 && (
            <Banner tone="info">{t("terms.preview.missing", { fields: unit.missing.map((f) => t(`terms.fields.names.${f}`)).join(", ") })}</Banner>
          )}
          <p className="whitespace-pre-wrap break-words" data-testid="terms-preview">
            {text.replace(/\{([a-z_]+)\}/g, (all, f: string) => (Object.hasOwn(unit.values, f) ? unit.values[f] : all))}
          </p>
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
  const editorRef = useRef<HTMLTextAreaElement>(null);
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.data) return <ErrorState onRetry={api.retry} />;

  const { canManage, current, versions, units } = api.data;
  const body = text ?? current.body;
  const next = current.version + 1;
  const changed = body.trim() !== current.body.trim() && body.trim().length > 0;
  // Entra na posição do cursor (ou no lugar da seleção), como nos textos de e-mail.
  const insert = (field: string) => {
    const el = editorRef.current;
    const mark = `{${field}}`;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setText(body.slice(0, start) + mark + body.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + mark.length, start + mark.length);
    });
  };
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
      const badField = e instanceof ApiError && e.fields.some((f) => /campo automático|sem fecho/.test(f.message));
      const key = status === 409 ? "conflict" : badField ? "fields" : status === 400 ? "invalid" : "generic";
      setMessage({ kind: "alert", text: t(`terms.errors.${key}`) });
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
        <div className="flex min-w-0 flex-col gap-4">
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
                <Textarea id={`terms-${kind}`} ref={editorRef} className="min-h-64 rounded-none border-0 py-3" value={body} onChange={(e) => setText(e.target.value)} />
              </div>
              {kind === "ENROLLMENT" && (
                <div role="group" aria-label={t("terms.fields.legend")} className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className="text-xs text-muted-foreground">
                    {t("terms.fields.legend")}
                  </span>
                  {FIELDS.map((f) => (
                    <Button key={f} type="button" variant="outline" size="sm" className="min-h-11 rounded-full text-xs" aria-label={t("terms.fields.insert", { field: t(`terms.fields.names.${f}`) })} onClick={() => insert(f)}>
                      {`{${f}}`}
                    </Button>
                  ))}
                </div>
              )}
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
          {kind === "ENROLLMENT" && <Preview text={canManage ? body : current.body} units={units} />}
        </div>
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
    </div>
  );
}

// RF-MAT-05: Coordenador publica; Administrador só consulta (canManage). A barreira de dados é o servidor.
export function TermsTab() {
  const { t } = useTranslation();
  // Item 747 (D2): `?aba=` é a aba de Organização; o tipo do termo fica em `?termo=`.
  const [kind, setKind] = useTabParam<TermsKind>(KINDS, KINDS[0], "termo");
  return (
    <div className="flex flex-col gap-4">
      <Tabs
        label={t("terms.tabs")}
        value={kind}
        onValueChange={setKind}
        tabs={KINDS.map((k) => ({ id: k, label: t(`terms.kinds.${k}`), content: <TermEditor key={k} kind={k} /> }))}
      />
    </div>
  );
}
