import { useState, type ComponentProps, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { Field, Input } from "@/components/ui/field";
import { PasswordRules } from "./PasswordRules";

interface Props {
  password: string;
  confirm: string;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  /** Erro vindo do servidor para o campo de senha (vazamento ou senha fraca). */
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
  /** Prefixo dos ids, para não repetir na mesma página. */
  idPrefix?: string;
  /** Rótulos dos dois campos (nova senha, convite). */
  labels?: { password: string; confirm: string };
}

// Senha nova com confirmação, exigências marcadas ao digitar e Mostrar/Ocultar (RN-ACE-08). Reutilizável pela #22.
export function PasswordFields({ password, confirm, onPassword, onConfirm, error, inputRef, idPrefix = "pw", labels: fieldLabels }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const labels = { show: t("password.show"), hide: t("password.hide") };
  const mismatch = confirm !== "" && confirm !== password;
  return (
    <>
      <Field id={`${idPrefix}-senha`} label={fieldLabels?.password ?? t("password.label")} error={error ?? undefined}>
        {(c) => (
          <PasswordInput
            {...c}
            show={show}
            onToggle={() => setShow((s) => !s)}
            labels={labels}
            ref={inputRef}
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            aria-describedby={[c["aria-describedby"], `${idPrefix}-regras`].filter(Boolean).join(" ")}
          />
        )}
      </Field>
      <PasswordRules id={`${idPrefix}-regras`} password={password} leaked={error === t("password.leaked")} />
      <Field id={`${idPrefix}-confirmar`} label={fieldLabels?.confirm ?? t("password.confirm")} error={mismatch ? t("password.mismatch") : undefined}>
        {(c) => <Input {...c} type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => onConfirm(e.target.value)} />}
      </Field>
    </>
  );
}

/** Campo de senha com "Mostrar"/"Ocultar" dentro do campo (canvas); quem usa guarda o estado e liga o rótulo pelas props do `Field`. */
export function PasswordInput({
  show,
  onToggle,
  labels,
  ref,
  ...rest
}: Omit<ComponentProps<typeof Input>, "type"> & { show: boolean; onToggle: () => void; labels: { show: string; hide: string } }) {
  return (
    <div className="relative flex">
      <Input {...rest} ref={ref} type={show ? "text" : "password"} className="pr-20" />
      <button
        type="button"
        className="absolute inset-y-0 right-0 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onToggle}
      >
        {show ? labels.hide : labels.show}
      </button>
    </div>
  );
}
