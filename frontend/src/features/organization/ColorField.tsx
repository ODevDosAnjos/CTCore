import { Check, CircleAlert, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { SWATCHES } from "./brandSwatches";
import { contrastRatio, isHexColor, passesContrast, suggestColor } from "./contrastRatio";

// Até duas casas, sem zero sobrando e com vírgula: 1,28 · 4,6 · 5,9.
const ratioText = (hex: string) => String(Math.round(contrastRatio(hex) * 100) / 100).replace(".", ",");

/** A cor escolhida entra por variável CSS (`--amostra`); o resto é token. */
const sample = (hex: string) => ({ "--amostra": hex }) as React.CSSProperties;

// Cor principal (RNF-22): campo único com ícone, cinco amostras e prévia "Pagar" com o selo de contraste; sem contraste, alerta e sugestão (B5).
export function ColorField({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  const valid = isHexColor(value);
  const pass = valid && passesContrast(value);
  const fails = valid && !pass;
  const message = error ?? (value !== "" && !valid ? t("organization.colorFormat") : undefined);
  const suggestion = fails ? suggestColor(value) : undefined;
  return (
    <div className="flex flex-col gap-3">
      <Field label={t("organization.colorHex")} error={message} alertError>
        {(c) => (
          <div className="relative">
            <Palette aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              {...c}
              aria-invalid={c["aria-invalid"] ?? (fails ? true : undefined)}
              type="text"
              inputMode="text"
              autoComplete="off"
              maxLength={7}
              disabled={disabled}
              value={value}
              onChange={(e) => onChange(e.target.value.trim())}
              className="pl-9"
            />
          </div>
        )}
      </Field>
      {fails && (
        <p role="alert" className="-mt-1 flex items-center gap-1.5 text-xs text-danger-foreground">
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {t("organization.contrastAlert", { ratio: ratioText(value) })}
        </p>
      )}
      <div role="group" aria-label={t("organization.colorSwatches")} className="flex gap-2">
        {SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            disabled={disabled}
            aria-label={t("organization.colorSwatch", { hex })}
            aria-pressed={value.toUpperCase() === hex}
            onClick={() => onChange(hex)}
            style={sample(hex)}
            className={cn(
              "size-8 rounded-md bg-(--amostra) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
              value.toUpperCase() === hex && "outline-2 outline-offset-2 outline-foreground",
            )}
          />
        ))}
      </div>
      {(value === "" || valid) && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("organization.previewLabel")}</span>
          <div className="flex flex-wrap items-center gap-3">
            <span
              style={valid ? sample(value) : undefined}
              className={cn("inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-brand-foreground", valid ? "bg-(--amostra)" : "bg-brand", fails && "min-w-40 justify-center")}
            >
              {fails ? t("organization.previewPayShort") : t("organization.previewPay")}
            </span>
            {value === "" && <span className="text-xs text-muted-foreground">{t("organization.colorDefault")}</span>}
            {pass && (
              <Badge tone="ok">
                <Check aria-hidden="true" className="size-3" />
                {t("organization.contrastBadge", { ratio: ratioText(value) })}
              </Badge>
            )}
            {fails && <span className="text-sm text-muted-foreground">{t("organization.previewIllegible")}</span>}
            {suggestion && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(suggestion)}
                className="ml-auto inline-flex min-h-8 items-center gap-2 rounded-md text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {t("organization.suggestion")}{" "}
                <span aria-hidden="true" style={sample(suggestion)} className="size-7 rounded-md bg-(--amostra)" />
                <span>
                  {suggestion} · {ratioText(suggestion)}:1
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
