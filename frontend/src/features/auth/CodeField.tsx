import type { Ref } from "react";
import { Field, Input } from "@/components/ui/field";
import { CodeInput } from "@/components/ui/code-input";

/** Campo de código das duas etapas: `totp` (6 caixas, envia ao completar) ou `any` (código de reserva, texto simples). */
export function CodeField({
  label,
  hideLabel,
  hint,
  value,
  onChange,
  onComplete,
  kind = "totp",
  error,
  inputRef,
}: {
  id?: string;
  label: string;
  hideLabel?: boolean;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  kind?: "totp" | "any";
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <Field label={label} hint={hint} error={error ?? undefined} alertError hideLabel={hideLabel}>
      {(c) =>
        kind === "totp" ? (
          <CodeInput {...c} ref={inputRef} value={value} onChange={onChange} onComplete={onComplete} />
        ) : (
          <Input
            {...c}
            ref={inputRef}
            type="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
            className="tracking-widest"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\s/g, ""))}
          />
        )
      }
    </Field>
  );
}
