import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { WindowSteps } from "@/components/ui/window-steps";
import { ApiError, api } from "@/lib/api";
import { BackupCodesBody, BackupCodesFooter } from "./BackupCodesDialog";
import { CodeField } from "./CodeField";

type Setup = { secret: string; otpauthUri: string };
type Phase =
  | { name: "loading" }
  | { name: "failed" }
  | { name: "forbidden" }
  | { name: "form"; setup: Setup; qr: string }
  | { name: "codes"; codes: string[] };

/** Chave em grupos de 4 ("JBSW Y3DP EHPK 3PXP"), mais fácil de digitar no app. */
const groupKey = (secret: string) => secret.replace(/\s/g, "").match(/.{1,4}/g)?.join(" ") ?? secret;

/**
 * Janela "Ativar duas etapas" (canvas DuasEtapas): passos 1 e 2 na mesma tela (QR, chave e código) e o 3 nos códigos de reserva (D4).
 * `required`: quem é obrigado (Coordenador) não tem "Agora não" (RN-ACE-17).
 */
export function TwoFactorSetupDialog({ open, onClose, onEnabled, required = false }: { open: boolean; onClose: () => void; onEnabled: () => void; required?: boolean }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  // Só com a janela aberta: cada abertura gera um segredo novo (o servidor substitui o pendente).
  useEffect(() => {
    if (!open) return;
    let live = true;
    api<Setup>("/auth/two-factor/setup", { method: "POST" })
      .then(async (setup) => {
        const qr = await QRCode.toDataURL(setup.otpauthUri, { margin: 1, width: 192 });
        if (live) setPhase({ name: "form", setup, qr });
      })
      .catch((err) => {
        if (live) setPhase(err instanceof ApiError && err.status === 403 ? { name: "forbidden" } : { name: "failed" });
      });
    return () => {
      live = false;
    };
  }, [open, attempt]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (code.length !== 6) {
      setError(t("twoFactor.setup.codeRequired"));
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await api<{ backupCodes: string[] }>("/auth/two-factor/enable", { method: "POST", body: { code } });
      setPhase({ name: "codes", codes: res.backupCodes });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_TWO_FACTOR_CODE") setError(t("twoFactor.setup.invalid"));
      else if (err instanceof ApiError && err.status === 429) setError(t("twoFactor.errors.tooMany"));
      else setError(t("twoFactor.errors.failed"));
    } finally {
      setSending(false);
    }
  }

  const inCodes = phase.name === "codes";
  const steps = [t("twoFactor.setup.stepRead"), t("twoFactor.setup.stepConfirm"), t("twoFactor.setup.stepSave")];
  let body;
  let footer;
  switch (phase.name) {
    case "loading":
      body = <LoadingState text={t("twoFactor.setup.loading")} />;
      break;
    case "forbidden":
      body = <ForbiddenState />;
      break;
    case "failed":
      body = (
        <ErrorState
          onRetry={() => {
            setPhase({ name: "loading" });
            setAttempt((a) => a + 1);
          }}
        />
      );
      break;
    case "codes":
      body = <BackupCodesBody codes={phase.codes} />;
      footer = <BackupCodesFooter saved={saved} onSaved={setSaved} onDone={onEnabled} />;
      break;
    case "form":
      body = (
        <form id="two-factor-setup" noValidate onSubmit={submit} className="grid gap-6 sm:grid-cols-[auto_1fr]" aria-busy={sending}>
          <img src={phase.qr} width={192} height={192} alt={t("twoFactor.setup.qrAlt")} className="mx-auto size-48 rounded-md border" />
          <div className="min-w-0 space-y-4">
            <p className="text-sm">{t("twoFactor.setup.step1")}</p>
            <div className="space-y-2">
              <p className="text-sm">{t("twoFactor.setup.step2")}</p>
              <p aria-label={t("twoFactor.setup.keyLabel")} className="break-all rounded-md border bg-surface-soft px-3 py-2 font-mono text-base">{groupKey(phase.setup.secret)}</p>
            </div>
            <CodeField id="setup-code" label={t("twoFactor.setup.codeLabel")} placeholder={t("twoFactor.setup.placeholder")} value={code} onChange={setCode} error={error} />
            <p className="text-sm text-muted-foreground">{t("twoFactor.setup.warning")}</p>
          </div>
        </form>
      );
      footer = (
        <>
          {!required && (
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("twoFactor.setup.later")}
            </Button>
          )}
          <Button type="submit" form="two-factor-setup" disabled={sending}>
            {sending ? t("twoFactor.setup.sending") : t("twoFactor.setup.submit")}
          </Button>
        </>
      );
      break;
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && !inCodes && onClose()} title={t("twoFactor.setup.title")} subtitle={t("twoFactor.setup.subtitle")} size="md" scrim="canvas" dismissible={!inCodes} footer={footer}>
      <div className="space-y-4">
        <WindowSteps steps={steps} current={inCodes ? 3 : code ? 2 : 1} />
        {body}
      </div>
    </Modal>
  );
}
