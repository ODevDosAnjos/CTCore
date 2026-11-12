import { useId, type ReactNode } from "react";
import { CHAR_COUNTER_FIELD, CharCounter } from "@/components/CharCounter";

/** Campo "Motivo *" das janelas de ação: rótulo com asterisco, contador, nota de apoio e erro ligado ao campo. */
export function ReasonField({ label, value, onChange, max = 200, note, error, optional, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; max?: number; note?: ReactNode; error?: string; optional?: boolean; rows?: number }) {
  const id = useId();
  const describedBy = [error && `${id}-erro`, note && `${id}-nota`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {!optional && (
          <span aria-hidden className="text-danger-foreground">
            {" "}*
          </span>
        )}
      </label>
      <CharCounter id={id} value={value} max={max} onChange={onChange} rows={rows} aria-required={optional ? undefined : "true"} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={CHAR_COUNTER_FIELD} />
      {note && (
        <p id={`${id}-nota`} className="text-xs text-muted-foreground">
          {note}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="text-sm text-danger-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
