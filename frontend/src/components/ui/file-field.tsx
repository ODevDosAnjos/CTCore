import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** Arquivo: botão e texto do pt-BR.json; o `<input type="file">` real fica no DOM (rótulo, `accept`, erro). */
export function FileField({ className, onChange, ...rest }: Omit<React.ComponentProps<"input">, "type" | "value">) {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLInputElement>(null);
  const [name, setName] = React.useState<string>();
  return (
    <div className={className ?? "flex flex-wrap items-center gap-3"}>
      <input
        {...rest}
        ref={ref}
        type="file"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          setName(e.target.files?.[0]?.name);
          onChange?.(e);
        }}
      />
      <Button type="button" variant="outline" className="min-h-11" disabled={rest.disabled} onClick={() => ref.current?.click()}>
        {t("fields.file.choose")}
      </Button>
      <span className="text-sm text-muted-foreground">{name ?? t("fields.file.none")}</span>
    </div>
  );
}
