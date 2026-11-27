import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { BackupCodesDialog } from "@/features/auth/BackupCodesDialog";
import { CodeField } from "@/features/auth/CodeField";
import { useSession } from "@/features/auth/SessionProvider";
import { TwoFactorSetupDialog } from "@/features/auth/TwoFactorSetupDialog";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useReloadSession } from "./useAccount";

type Dialog = "setup" | "replace" | "codes" | "disable" | null;

// RN-ACE-17: quem é obrigado (Coordenador) não vê "Desligar"; o servidor também recusa (403).
export function TwoFactorSection({ portal = false }: { portal?: boolean }) {
  const { t } = useTranslation();
  const { state } = useSession();
  const reload = useReloadSession();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [failed, setFailed] = useState(false);
  const [replaced, setReplaced] = useState(false);
  if (state.status !== "ready") return null;
  const { enabled, required, enabledAt, backupCodesRemaining } = state.session.twoFactor;

  async function changed() {
    setDialog(null);
    setFailed(false);
    setReplaced(false);
    try {
      await reload();
    } catch {
      setFailed(true);
    }
  }

  const badge = <Badge tone={enabled ? "ok" : "neutral"}>{t(enabled ? "account.twoFactor.on" : "account.twoFactor.off")}</Badge>;
  return (
    <Card title={t("account.twoFactor.title")} heading="h2" titleClassName={portal ? CARD_TITLE : undefined} actions={portal && badge}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {!portal && badge}
          <span className="text-sm text-muted-foreground">
            {portal ? t(enabled ? "account.twoFactor.portalOn" : "account.twoFactor.portalOff") : enabled && enabledAt ? t("account.twoFactor.detailOn", { date: formatDate(enabledAt) }) : enabled ? "" : t("account.twoFactor.detailOff")}
          </span>
        </div>
        {enabled && backupCodesRemaining !== undefined && <p className="text-sm text-muted-foreground">{t("account.twoFactor.codesLeft", { n: backupCodesRemaining })}</p>}
        {replaced && <Banner tone="ok">{t("account.twoFactor.replaced")}</Banner>}
        {failed && <ErrorState onRetry={() => void changed()} />}
        <div className={portal ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
          {!enabled && <Button variant={portal ? "secondary" : "primary"} onClick={() => setDialog("setup")}>{t(portal ? "account.twoFactor.enableShort" : "account.twoFactor.enable")}</Button>}
          {enabled && (
            <Button variant="secondary" onClick={() => setDialog("replace")}>
              {t("account.twoFactor.replace")}
            </Button>
          )}
          {enabled && (
            <Button variant="secondary" onClick={() => setDialog("codes")}>
              {t("account.twoFactor.newCodes")}
            </Button>
          )}
          {enabled && !required && (
            <Button variant="secondary" onClick={() => setDialog("disable")}>
              {t("account.twoFactor.disable")}
            </Button>
          )}
        </div>
      </div>
      {dialog === "setup" && (
        <TwoFactorSetupDialog
          open
          required={required}
          onClose={() => setDialog(null)}
          onEnabled={() => void changed()}
        />
      )}
      {dialog === "replace" && (
        <TwoFactorSetupDialog
          open
          replace
          onClose={() => setDialog(null)}
          onEnabled={() => {
            void changed();
            setReplaced(true); // depois de changed(), que limpa o aviso anterior
          }}
        />
      )}
      {/* Fechar relê a sessão: a contagem volta a 10. */}
      {dialog === "codes" && (
        <BackupCodesDialog open onClose={() => void changed()} />
      )}
      {dialog === "disable" && (
        <DisableDialog
          onClose={() => setDialog(null)}
          onDisabled={() => void changed()}
        />
      )}
    </Card>
  );
}

function DisableDialog({
  onClose,
  onDisabled,
}: {
  onClose: () => void;
  onDisabled: () => void;
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    code?: string;
    form?: string;
  }>({});
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<"form" | "failed" | "forbidden">("form");

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (sending) return;
    if (!password || !code) {
      setErrors({ form: t("twoFactor.codes.required") });
      return;
    }
    setErrors({});
    setPhase("form");
    setSending(true);
    try {
      await api<void>("/auth/two-factor", {
        method: "DELETE",
        body: { password, code },
      });
      onDisabled();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const apiCode = err instanceof ApiError ? err.code : "";
      if (apiCode === "INVALID_CREDENTIALS")
        setErrors({ password: t("reauth.invalidPassword") });
      else if (apiCode === "INVALID_TWO_FACTOR_CODE")
        setErrors({ code: t("reauth.invalidCode") });
      else if (status === 429)
        setErrors({ form: t("twoFactor.errors.tooMany") });
      else if (status === 403) setPhase("forbidden");
      else setPhase("failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && !sending && onClose()}
      title={t("account.twoFactor.disableTitle")}
      size="sm"
      footer={
        phase === "form" && (
          <>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="disable-two-factor" disabled={sending}>
              {sending ? t("account.twoFactor.disabling") : t("account.twoFactor.disableSubmit")}
            </Button>
          </>
        )
      }
    >
      {phase === "forbidden" ? (
        <ForbiddenState />
      ) : phase === "failed" ? (
        <ErrorState onRetry={() => void submit()} />
      ) : (
        <form
          id="disable-two-factor"
          noValidate
          onSubmit={submit}
          className="space-y-4"
          aria-busy={sending}
        >
          <p className="text-sm">{t("account.twoFactor.disableIntro")}</p>
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <Field
            label={t("reauth.password")}
            error={errors.password}
            alertError
          >
            {(c) => (
              <Input
                {...c}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          <CodeField
            id="off-code"
            kind="any"
            label={t("reauth.code")}
            value={code}
            onChange={setCode}
            error={errors.code}
          />
        </form>
      )}
    </Modal>
  );
}
