import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ReasonField } from "@/components/ReasonField";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { SummaryBox } from "@/components/ui/summary-box";
import { Select } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { scheduleText, type ClassChoice, type PlanChoice } from "./modalityDialogSummary";
import { useResource } from "./useStudentRecord";

export interface Choice {
  id: string;
  name: string;
}

// Turmas e planos ativos da unidade e da modalidade; unidade nula (ainda não escolhida) não pede nada.
export const useClassChoices = (unitId: string | null, modalityId: string) => useResource<{ items: ClassChoice[] }>(unitId ? `/classes?unitId=${unitId}&modalityId=${modalityId}&status=ACTIVE&size=100` : null);
export const usePlanChoices = (unitId: string | null, modalityId: string) => useResource<{ items: PlanChoice[] }>(unitId ? `/plans?unitId=${unitId}&modalityId=${modalityId}&status=ACTIVE&size=100` : null);

export function PickSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (v: string) => void; options: Choice[]; error?: string }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
      >
        <option value="">{t("students.record.enrollment.choose")}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
      {error && (
        <p id={`${id}-erro`} className="text-sm text-danger-foreground">
          {error}
        </p>
      )}
    </div>
  );
}

/** Linha somente leitura (Modalidade, Turma principal atual, De). */
export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-sm font-medium">{label}</span>
      <div className="mt-1 min-h-11 rounded-md border border-input bg-surface-soft px-3 py-2.5 text-sm">{value}</div>
    </div>
  );
}

// Outros horários: as demais turmas da modalidade, marcadas uma a uma.
export function OtherClasses({ options, primary, value, onChange, error }: { options: ClassChoice[]; primary: string; value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const { t } = useTranslation();
  const rest = options.filter((o) => o.id !== primary);
  if (rest.length === 0) return null;
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium">{t("students.record.enrollment.otherClasses")}</legend>
      <p className="text-xs text-muted-foreground">{t("students.record.enrollment.class.otherHint")}</p>
      {rest.map((o) => (
        <label key={o.id} className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={value.includes(o.id)} onChange={(e) => onChange(e.target.checked ? [...value, o.id] : value.filter((x) => x !== o.id))} />
          {o.schedule?.length ? `${o.name} (${scheduleText(t, o.schedule)})` : o.name}
        </label>
      ))}
      {error && <p className="text-sm text-danger-foreground">{error}</p>}
    </fieldset>
  );
}

// Estado combinado das leituras da janela: a pior vence.
export function combine(...r: { status: string; reload: () => void }[]): { state: "loading" | "forbidden" | "error" | "ready"; retry: () => void } {
  const s = r.map((x) => x.status);
  const state = s.includes("forbidden") ? "forbidden" : s.some((x) => x === "error" || x === "notFound") ? "error" : s.includes("loading") ? "loading" : "ready";
  return { state, retry: () => r.forEach((x) => x.reload()) };
}

// Janela das três trocas: título, aviso de quando vale, opções carregadas (quatro estados) e o erro do servidor no campo ou no alto, sem fechar.
export function ModalityDialog({
  title,
  effect,
  state,
  retry,
  submitLabel,
  canSubmit,
  work,
  onClose,
  onDone,
  errorPrefix = "students.record.enrollment.errors.",
  children,
  size,
  summary,
  reason,
  cancelLabel,
  fullOnMobile,
  submitVariant,
}: {
  title: string;
  effect?: string;
  state: "loading" | "forbidden" | "error" | "ready";
  retry?: () => void;
  submitLabel: string;
  canSubmit: boolean;
  work: () => Promise<unknown>;
  onClose: () => void;
  onDone: () => void;
  /** Chaves pt-BR dos erros sem campo (por status e `generic`); o padrão é o das trocas de matrícula. */
  errorPrefix?: string;
  children: (errors: Record<string, string>) => ReactNode;
  /** Janela do canvas: Cancelar e a ação vão para o rodapé fixo da `Modal`. */
  size?: "sm" | "md";
  /** Bloco "Resumo" (setas), depois do corpo e antes do motivo. */
  summary?: string[];
  /** Campo "Motivo" ao fim do corpo; `optional` tira o asterisco. */
  reason?: { label: string; value: string; onChange: (v: string) => void; optional?: boolean };
  /** Texto do botão que fecha no rodapé (com `size`); o padrão é "Voltar". */
  cancelLabel?: string;
  fullOnMobile?: boolean;
  /** Variante do botão de ação (vermelho cheio em Encerrar). */
  submitVariant?: "primary" | "dangerSolid";
}) {
  const { t } = useTranslation();
  const formId = useId();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setErrors({});
    setForm(undefined);
    try {
      await work();
      onDone();
      onClose();
    } catch (err) {
      const failure = err instanceof ApiError ? err : null;
      if (failure?.fields.length) setErrors(Object.fromEntries(failure.fields.map((f) => [f.field.split(".").pop()!, f.message])));
      else setForm(t(`${errorPrefix}${failure?.status ?? "generic"}`, { defaultValue: t(`${errorPrefix}generic`) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      size={size}
      fullOnMobile={fullOnMobile}
      footer={
        size && state === "ready" ? (
          <>
            <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
              {cancelLabel ?? t("common.back")}
            </Button>
            <Button type="submit" form={formId} variant={submitVariant} className="min-h-11" disabled={busy || !canSubmit}>
              {submitLabel}
            </Button>
          </>
        ) : undefined
      }
    >
      {state === "loading" && <LoadingState />}
      {state === "forbidden" && <ForbiddenState />}
      {state === "error" && retry && <ErrorState onRetry={retry} />}
      {state === "ready" && (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-3">
          {effect && <p className="text-sm text-muted-foreground">{effect}</p>}
          {form && (
            <Banner tone="danger">
              {form}
            </Banner>
          )}
          {children(errors)}
          {summary && summary.length > 0 && <SummaryBox label={t("students.record.enrollment.summaryLabel")} items={summary} />}
          {reason && <ReasonField label={reason.label} value={reason.value} onChange={reason.onChange} optional={reason.optional} error={errors.reason} />}
          {!size && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="min-h-11" disabled={busy || !canSubmit}>
                {submitLabel}
              </Button>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
