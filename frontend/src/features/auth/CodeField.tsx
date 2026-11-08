import type { Ref } from "react";
import { Field, Input } from "@/components/ui/field";
import { CodeInput } from "@/components/ui/code-input";

/** Campo de código das duas etapas: `totp` (6 caixas) ou `any` (TOTP ou código de reserva, texto simples). */
export function CodeField({
  label,
  value,
  onChange,
  kind = "totp",
  error,
  inputRef,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  kind?: "totp" | "any";
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <Field label={label} error={error ?? undefined} alertError>
      {(c) =>
        kind === "totp" ? (
          <CodeInput {...c} ref={inputRef} value={value} onChange={onChange} />
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
