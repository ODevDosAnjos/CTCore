import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";

/** Linha do canvas: título e texto de apoio à esquerda, interruptor à direita; `control` troca o interruptor (ex.: "Em breve"). */
export function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  control,
}: {
  label: string;
  description?: ReactNode;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  control?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {control ?? <Switch label={label} checked={!!checked} onCheckedChange={(v) => onChange?.(v)} disabled={disabled} />}
    </div>
  );
}
