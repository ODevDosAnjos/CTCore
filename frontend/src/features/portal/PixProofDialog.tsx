import { useId, useState, type FormEvent } from "react";
import { Copy, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FileField } from "@/components/ui/file-field";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { pixKeyType, sendProof, usePixInstructions } from "./usePixProof";

type Props = { chargeIds: string[]; onClose: () => void; onSent?: () => void; /** Nome das cobranças ("A e B"), mostrado no celular. */ description?: string };

// RF-COB-05, RF-POR-05: janela "Pix na chave com comprovante" para uma ou várias cobranças da mesma unidade; o servidor confere quem paga e o arquivo.
// Abaixo de 640 px é página cheia (canvas PortalMPixChave).
export function PixProofDialog({ chargeIds, onClose, onSent, description }: Props) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const formId = useId();
  const fileId = useId();
  const { state, reload } = usePixInstructions(chargeIds);
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [copy, setCopy] = useState<"copied" | "failed">();
  const data = state.status === "ready" ? state.data : undefined;

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(data?.pixKey ?? "");
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !file) return;
    setBusy(true);
    setFieldError(undefined);
    setFormError(undefined);
    try {
      await sendProof(chargeIds, file);
      setSent(true);
      onSent?.();
    } catch (err) {
      const failure = err instanceof ApiError ? err : null;
      const onFile = failure?.fields.find((f) => f.field === "file");
      if (onFile) setFieldError(onFile.message);
      else setFormError(t(`pixProof.errors.${failure?.status ?? "generic"}`, { defaultValue: t("pixProof.errors.generic") }));
    } finally {
      setBusy(false);
    }
  }

  const footer =
    data && !sent ? (
      narrow ? (
        <Button type="submit" form={formId} className="min-h-11 w-full" disabled={busy || !file}>
          {t("pixProof.submit")}
        </Button>
      ) : (
        <>
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} className="min-h-11" disabled={busy || !file}>
            {t("pixProof.submit")}
          </Button>
        </>
      )
    ) : undefined;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t(narrow ? "pixProof.titleMobile" : "pixProof.title")} size="md" fullOnMobile footer={footer}>
      {state.status === "loading" && <LoadingState />}
      {state.status === "forbidden" && <ForbiddenState />}
      {state.status === "error" && <ErrorState onRetry={reload} />}
      {state.status === "notFound" && <EmptyState title={t("pixProof.errors.404")} />}
      {state.status === "noKey" && <EmptyState title={t("pixProof.noKeyTitle")} text={t("pixProof.noKeyText")} />}
      {state.status === "badSelection" && <EmptyState title={t("pixProof.badSelectionTitle")} text={t("pixProof.badSelectionText")} />}
      {state.status === "notPayable" && <EmptyState title={t("pixProof.notPayableTitle")} text={t("pixProof.notPayableText")} />}
      {data && sent && (
        <div className="flex flex-col gap-3">
          <p role="status">{t("pixProof.done")}</p>
          <div className="flex justify-end">
            <Button type="button" className="min-h-11" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      )}
      {data && !sent && (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
          {!narrow && <Banner tone="warn">{t("pixProof.offline", { unit: data.unit })}</Banner>}
          {formError && (
            <p role="alert" className="text-sm text-danger-foreground">
              {formError}
            </p>
          )}
          {narrow && (
            <div className="flex flex-col gap-1">
              <p className="font-heading text-4xl font-semibold">{formatCurrency(data.amountCents)}</p>
              {description && <p className="break-words text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 rounded-md border p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("pixProof.keyCard", { type: t(`pixProof.keyType.${pixKeyType(data.pixKey)}`) })}</p>
              <p className="break-all font-medium">{data.pixKey}</p>
              <p className="break-words text-sm text-muted-foreground">{t("pixProof.holder", { name: data.unit })}</p>
            </div>
            {narrow ? (
              <Button type="button" variant="outline" size="icon" aria-label={t("pixProof.copy")} onClick={() => void copyKey()}>
                <Copy aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={() => void copyKey()}>
                <Copy aria-hidden="true" />
                {t("pixProof.copy")}
              </Button>
            )}
          </div>
          {copy && (
            <span role="status" className="text-sm">
              {t(copy === "copied" ? "pixProof.copied" : "pixProof.copyFailed")}
            </span>
          )}
          {!narrow && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("pixProof.amount")} </span>
              <span className="font-medium">{t("pixProof.noFee", { value: formatCurrency(data.amountCents) })}</span>
            </p>
          )}
          {data.charges && (
            <ul aria-label={t("pixProof.charges")} className="flex flex-col gap-1 text-sm">
              {data.charges.map((c) => (
                <li key={c.chargeId} className="flex flex-wrap justify-between gap-x-3">
                  <span className="break-words">
                    {c.studentName} · {formatDate(c.dueOn)}
                  </span>
                  <span>{formatCurrency(c.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2">
            {!narrow && <span className="text-sm font-medium">{t("pixProof.proof")}</span>}
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-5 text-center">
              <Upload aria-hidden="true" className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">{t(narrow ? "pixProof.dropMobile" : "pixProof.drop")}</p>
              <p className="text-xs text-muted-foreground">{t(narrow ? "pixProof.dropMobileHint" : "pixProof.dropHint")}</p>
              <FileField
                id={fileId}
                className="flex flex-wrap items-center justify-center gap-3"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                aria-label={t("pixProof.file")}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? `${fileId}-erro` : undefined}
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </div>
            {fieldError && (
              <p id={`${fileId}-erro`} className="text-sm text-danger-foreground">
                {fieldError}
              </p>
            )}
          </div>
          {narrow ? (
            <SummaryBox label={t("pixProof.summaryLabel")} items={[t("pixProof.summaryReview"), t("pixProof.summaryNotice")]} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("pixProof.effect")}</p>
          )}
        </form>
      )}
    </Modal>
  );
}
