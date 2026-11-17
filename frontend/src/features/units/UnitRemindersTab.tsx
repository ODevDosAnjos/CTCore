import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Err, Text } from "./Text";
import { MAX_REMINDERS, STANDARD_REMINDER_DAYS, type TabProps } from "./unitDraft";
import { SwitchRow } from "./SwitchRow";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

// Aba Lembretes (R5, RN-COB-17): um interruptor por dia (desligar tira o dia da lista), o geral, a hora cheia e o aviso fixo.
export function UnitRemindersTab({ d, set, errors }: TabProps) {
  const { t } = useTranslation();
  // Dia salvo fora dos quatro padrões continua na tela, como linha própria.
  const days = [...new Set([...STANDARD_REMINDER_DAYS, ...d.reminderDays])].sort((a, b) => a - b);
  const toggle = (day: number, on: boolean) => set("reminderDays")(on ? [...d.reminderDays, day].sort((a, b) => a - b) : d.reminderDays.filter((x) => x !== day));
  const title = (day: number) => (day === 0 ? t("unitSettings.reminderOnDue") : t(day < 0 ? "unitSettings.reminderBefore" : "unitSettings.reminderAfter", { count: Math.abs(day) }));
  const help = (day: number) => t((STANDARD_REMINDER_DAYS as readonly number[]).includes(day) ? `unitSettings.reminderHelp.${day}` : "unitSettings.reminderHelp.custom");
  return (
    <div className="flex flex-col gap-4">
      <Card heading="h2" title={t("unitSettings.sections.reminders")}>
        <div className="flex flex-col gap-2">
          <SwitchRow label={t("unitSettings.remindersEnabled")} description={t("unitSettings.remindersEnabledHelp")} checked={d.remindersEnabled} onChange={set("remindersEnabled")} />
          {!d.remindersEnabled && <p className="text-sm">{t("unitSettings.remindersOff")}</p>}
          <Err text={errors["settings.reminderDays"]} />
          <ul className="flex flex-col divide-y">
            {days.map((day) => {
              const on = d.reminderDays.includes(day);
              return (
                <li key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <Switch label={title(day)} checked={on} onCheckedChange={(v) => toggle(day, v)} disabled={!d.remindersEnabled || (!on && d.reminderDays.length >= MAX_REMINDERS)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{title(day)}</p>
                    <p className="text-xs text-muted-foreground">{help(day)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Checkbox label={t("unitSettings.channelEmail")} checked disabled readOnly />
                    <ComingSoon variant="switch" label={t("unitSettings.channelPush")} />
                  </div>
                </li>
              );
            })}
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <Switch label={t("unitSettings.blockNoticeTitle")} checked disabled onCheckedChange={() => undefined} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("unitSettings.blockNoticeTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("unitSettings.blockNoticeText")}</p>
              </div>
              <Badge tone="neutral">{t("unitSettings.alwaysOn")}</Badge>
            </li>
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Field label={t("unitSettings.remindersHour")}>
                {(c) => (
                  <Select {...c} value={String(d.remindersHour)} disabled={!d.remindersEnabled} onChange={(e) => set("remindersHour")(Number(e.target.value))}>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {t("unitSettings.hourOption", { hour: h })}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Err text={errors["settings.remindersHour"]} />
            </div>
            <Text label={t("unitSettings.minors")} value={t("unitSettings.minorsValue")} onChange={() => undefined} readOnly />
          </div>
        </div>
      </Card>
      <Banner tone="info">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{t("unitSettings.remindersStop")}</span>
          <Link to="/configuracoes/textos" className={cn(buttonVariants({ variant: "secondary" }))}>
            {t("unitSettings.editTexts")}
          </Link>
        </div>
      </Banner>
    </div>
  );
}
