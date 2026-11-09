import { useId } from "react";
import { cn } from "@/lib/utils";
import { RadioCard } from "./radio-card";

export type ChoiceOption = { value: string; label: string; description?: string };

/** Escolha de uma opção entre várias, em cartões (1 ou 2 colunas); a legenda dá o nome ao grupo. */
export function ChoiceCards({ legend, options, value, onChange, columns = 1, required, className }: { legend: string; options: ChoiceOption[]; value: string; onChange: (value: string) => void; columns?: 1 | 2; required?: boolean; className?: string }) {
  const name = useId();
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="mb-1 text-sm font-medium">{legend}
        {required && (
          <span aria-hidden className="text-danger-foreground">
            {" "}*
          </span>
        )}
      </legend>
      <div className={cn("grid gap-2", columns === 2 && "grid-cols-2")}>
        {options.map((o) => (
          <RadioCard key={o.value} name={name} label={o.label} description={o.description} checked={value === o.value} onChange={() => onChange(o.value)} />
        ))}
      </div>
    </fieldset>
  );
}
