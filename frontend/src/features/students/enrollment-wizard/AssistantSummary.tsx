import { useTranslation } from "react-i18next";

// Coluna "Até aqui" das etapas 2 e 3 (some abaixo de 1024 px; no celular o canvas não a mostra).
export function AssistantSummary({ name, age, financial, unit }: { name: string; age?: number; financial?: string; unit?: string }) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.sofar.";
  const row = (label: string, value: string) => (
    <div key={label}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value}</dd>
    </div>
  );
  return (
    <aside aria-label={t(`${k}title`)} className="hidden w-64 shrink-0 self-start rounded-lg border bg-muted/40 p-4 lg:block">
      <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{t(`${k}title`)}</h2>
      <dl className="flex flex-col gap-3">
        {row(t(`${k}student`), age === undefined ? name : t(`${k}studentAge`, { name, age }))}
        {financial && row(t(`${k}financial`), financial)}
        {unit && row(t(`${k}unit`), unit)}
      </dl>
    </aside>
  );
}
