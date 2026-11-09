import { useId } from "react";
import { cn } from "@/lib/utils";

/** Alternador de 2 ou 3 opções (ex.: Manter | Cancelar), feito de botões de opção nativos. */
export function SegmentedChoice({ label, options, value, onChange, className }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void; className?: string }) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md border border-input bg-card p-0.5", className)}>
      {options.map((o) => (
        <label
          key={o.value}
          className="flex min-h-11 cursor-pointer items-center justify-center rounded-sm px-4 text-sm font-medium has-[:checked]:bg-brand has-[:checked]:text-brand-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
        >
          <input type="radio" name={name} className="sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}
