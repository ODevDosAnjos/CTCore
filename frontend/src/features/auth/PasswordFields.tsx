import { useState, type ComponentProps, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
  /** Visual anterior (botão ao lado e lista simples), mantido para Minha conta até a #490. */
  classic?: boolean;
}

// Senha nova com confirmação, exigências marcadas ao digitar e Mostrar/Ocultar (RN-ACE-08). Reutilizável pela #22.
export function PasswordFields({ password, confirm, onPassword, onConfirm, error, inputRef, idPrefix = "pw", labels: fieldLabels, classic = false }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const labels = { show: t("password.show"), hide: t("password.hide") };
  const mismatch = confirm !== "" && confirm !== password;
  return (
    <>
      <Field id={`${idPrefix}-senha`} label={fieldLabels?.password ?? t("password.label")} error={error ?? undefined}>
        {(c) => (
          classic ? (
            <div className="flex gap-2">
              <Input
                {...c}
                ref={inputRef}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => onPassword(e.target.value)}
                aria-describedby={[c["aria-describedby"], `${idPrefix}-regras`].filter(Boolean).join(" ")}
              />
              <Button type="button" variant="secondary" onClick={() => setShow((s) => !s)}>
                {show ? labels.hide : labels.show}
              </Button>
            </div>
          ) : (
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
          )
        )}
      </Field>
      <PasswordRules id={`${idPrefix}-regras`} password={password} classic={classic} leaked={error === t("password.leaked")} />
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
