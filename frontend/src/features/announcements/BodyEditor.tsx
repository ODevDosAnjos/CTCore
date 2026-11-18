import { useRef } from "react";
import { Bold, Link2, List } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Textarea } from "@/components/ui/field";

export const BODY_MAX = 2000;

// RN-COM-05: a barra só insere a sintaxe do formato mínimo (**negrito**, "- lista" e [texto](https://...)) na seleção do texto.
// `short`: celular (canvas sem barra, contador "N / 2.000"). Passou de 90% do limite: aviso por leitor de tela.
export function BodyEditor({ id, value, onChange, short, ...rest }: { id: string; value: string; onChange: (v: string) => void; short?: boolean; "aria-invalid"?: true; "aria-required"?: true; "aria-describedby"?: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLTextAreaElement>(null);

  // Troca o trecho [from, to) por `text` e deixa a seleção em [selFrom, selTo) (posições dentro do texto novo).
  function edit(from: number, to: number, text: string, selFrom: number, selTo: number) {
    onChange((value.slice(0, from) + text + value.slice(to)).slice(0, BODY_MAX));
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(from + selFrom, from + selTo);
    });
  }
  const range = () => [ref.current?.selectionStart ?? value.length, ref.current?.selectionEnd ?? value.length] as const;

  function bold() {
    const [a, b] = range();
    edit(a, b, `**${value.slice(a, b)}**`, 2, 2 + (b - a));
  }
  function bullet() {
    const [a] = range();
    const start = value.lastIndexOf("\n", a - 1) + 1;
    edit(start, start, "- ", 2 + (a - start), 2 + (a - start));
  }
  function link() {
    const [a, b] = range();
    const label = value.slice(a, b) || t("announcements.new.editor.linkText");
    edit(a, b, `[${label}](https://)`, label.length + 3, label.length + 11);
  }

  const warn = value.length >= BODY_MAX ? t("counter.atLimit") : value.length > BODY_MAX * 0.9 ? t("counter.nearLimit") : "";
  const counter = t(short ? "announcements.new.editor.counterShort" : "announcements.new.editor.counter", { used: value.length.toLocaleString("pt-BR"), max: BODY_MAX.toLocaleString("pt-BR") });
  return (
    <div>
      <div className="overflow-hidden rounded-md border border-input">
        {!short && (
          <div role="toolbar" aria-label={t("announcements.new.editor.toolbar")} className="flex flex-wrap items-center gap-1 border-b border-input bg-surface-soft p-1">
            <Button type="button" variant="ghost" size="icon" aria-label={t("announcements.new.editor.bold")} title={t("announcements.new.editor.bold")} onClick={() => bold()}>
              <Bold aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label={t("announcements.new.editor.bullet")} title={t("announcements.new.editor.bullet")} onClick={() => bullet()}>
              <List aria-hidden />
            </Button>
            <ComingSoon variant="button" label={t("announcements.new.editor.numbered")} />
            <Button type="button" variant="ghost" size="icon" aria-label={t("announcements.new.editor.link")} title={t("announcements.new.editor.link")} onClick={() => link()}>
              <Link2 aria-hidden />
            </Button>
          </div>
        )}
        <Textarea {...rest} id={id} ref={ref} rows={short ? 4 : 6} value={value} className="min-h-0 rounded-none border-0 p-3" onChange={(e) => onChange(e.target.value.slice(0, BODY_MAX))} />
      </div>
      <p className={short ? "mt-1 text-right text-xs text-muted-foreground" : "mt-1 text-xs text-muted-foreground"}>{counter}</p>
      <p role="status" className="sr-only">
        {warn}
      </p>
    </div>
  );
}
