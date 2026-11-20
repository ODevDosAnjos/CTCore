import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { CodeField } from "@/features/auth/CodeField";
import { useSession } from "@/features/auth/SessionProvider";
import { ApiError, api } from "@/lib/api";

const FORM = "change-email-form";

// RN-ACE-15 (D2): o pedido exige a senha e, com as duas etapas, o código. O e-mail só muda ao abrir o link. Janela "Trocar e-mail" do canvas (rodapé fixo).
export function ChangeEmailForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const withCode = !!session?.twoFactor.enabled;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    code?: string;
    form?: string;
  }>({});
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSentTo(null);
    if (!email.trim() || !password || (withCode && !code)) {
      setErrors({ form: t("account.email.required") });
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await api<void>("/auth/email-change", {
        method: "POST",
        body: {
          newEmail: email.trim(),
          password,
          ...(withCode ? { code } : {}),
        },
      });
      setSentTo(email.trim());
      setEmail("");
      setPassword("");
      setCode("");
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const apiCode = err instanceof ApiError ? err.code : "";
      if (apiCode === "INVALID_CREDENTIALS")
        setErrors({ password: t("reauth.invalidPassword") });
      else if (apiCode === "INVALID_TWO_FACTOR_CODE")
        setErrors({ code: t("reauth.invalidCode") });
      else if (status === 400) setErrors({ email: t("account.email.invalid") });
      else if (status === 429)
        setErrors({ form: t("twoFactor.errors.tooMany") });
      else setErrors({ form: t("twoFactor.errors.failed") });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("account.email.modalTitle")}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("account.email.cancel")}
          </Button>
          <Button type="submit" form={FORM} disabled={sending}>
            {sending ? t("account.email.sending") : t("account.email.submit")}
          </Button>
        </>
      }
    >
      <form id={FORM} noValidate onSubmit={submit} className="space-y-4" aria-busy={sending}>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <Field label={t("account.email.new")} required error={errors.email} alertError>
          {(c) => <Input {...c} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label={t("account.email.password")} required hint={t("account.email.passwordHint")} error={errors.password} alertError>
          {(c) => <Input {...c} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        {withCode && <CodeField id="acc-email-code" kind="any" label={`${t("account.email.code")} *`} hint={t("account.email.codeHint")} value={code} onChange={setCode} error={errors.code} />}
        <SummaryBox label={t("account.email.summaryLabel")} items={[t("account.email.summary1"), t("account.email.summary2"), t("account.email.summary3"), t("account.email.summary4")]} />
        {sentTo && (
          <p role="status" className="text-sm">
            {t("account.email.sent", { email: sentTo })}
          </p>
        )}
      </form>
    </Modal>
  );
}
