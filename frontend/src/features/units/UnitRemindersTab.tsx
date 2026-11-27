import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field, Input, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { hrefOf } from "@/routes";
import { Err, Text } from "./Text";
import { REMINDER_MAX, isReminderDay, type ReminderDayKey, type TabProps } from "./unitDraft";
import { SwitchRow } from "./SwitchRow";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const REMINDERS = ["before", "due", "afterFirst", "afterSecond"] as const;
// issue 638: o texto tem largura mínima; sem espaço, os canais descem de linha em vez de espremer as palavras a 390 px.
const TEXT_BLOCK = "min-w-0 flex-[1_1_12rem]";

// Aba Lembretes (RN-COB-17): quatro lembretes fixos, cada um com a chave e, fora o do dia, o campo do dia; o geral, a hora e o aviso fixo.
export function UnitRemindersTab({ d, set, problems, errors }: TabProps) {
  const { t } = useTranslation();
  const toggle = (key: (typeof REMINDERS)[number], enabled: boolean) => set("reminders")({ ...d.reminders, [key]: { ...d.reminders[key], enabled } });
  const setDays = (key: ReminderDayKey, days: string) => set("reminders")({ ...d.reminders, [key]: { ...d.reminders[key], days } });
  // Com o dia inválido, o título usa o nome do lembrete.
  const title = (key: (typeof REMINDERS)[number]) => {
    if (key === "due") return t("unitSettings.reminderOnDue");
    const { days } = d.reminders[key];
    if (!isReminderDay(key, days)) return t(`unitSettings.reminderName.${key}`);
    return t(key === "before" ? "unitSettings.reminderBefore" : "unitSettings.reminderAfter", { count: Number(days) });
  };
  return (
    <div className="flex flex-col gap-4">
      <Card heading="h2" title={t("unitSettings.sections.reminders")}>
        <div className="flex flex-col gap-2">
          <SwitchRow label={t("unitSettings.remindersEnabled")} description={t("unitSettings.remindersEnabledHelp")} checked={d.remindersEnabled} onChange={set("remindersEnabled")} />
          {!d.remindersEnabled && <p className="text-sm">{t("unitSettings.remindersOff")}</p>}
          <Err text={errors["settings.reminders"]} />
          <ul className="flex flex-col divide-y">
            {REMINDERS.map((key) => (
              <li key={key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <Switch label={title(key)} checked={d.reminders[key].enabled} onCheckedChange={(v) => toggle(key, v)} disabled={!d.remindersEnabled} />
                <div className={TEXT_BLOCK}>
                  <p className="text-sm font-medium">{title(key)}</p>
                  <p className="text-xs text-muted-foreground">{t(`unitSettings.reminderHelp.${key}`)}</p>
                  {key !== "due" && (
                    <Field
                      className="mt-2"
                      label={t(`unitSettings.reminderDaysLabel.${key}`)}
                      error={problems[`reminders.${key}`] ?? errors[`settings.reminders.${key}.days`]}
                    >
                      {(control) => (
                        <Input
                          {...control}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={REMINDER_MAX[key]}
                          className="w-24"
                          value={d.reminders[key].days}
                          disabled={!d.remindersEnabled}
                          onChange={(event) => setDays(key, event.target.value)}
                        />
                      )}
                    </Field>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Checkbox label={t("unitSettings.channelEmail")} checked disabled readOnly />
                  <ComingSoon variant="switch" label={t("unitSettings.channelPush")} />
                </div>
              </li>
            ))}
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <Switch label={t("unitSettings.blockNoticeTitle")} checked disabled onCheckedChange={() => undefined} />
              <div className={TEXT_BLOCK}>
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
          <Link to={`${hrefOf("organizationSettings")}?aba=textos`} className={cn(buttonVariants({ variant: "secondary" }))}>
            {t("unitSettings.editTexts")}
          </Link>
        </div>
      </Banner>
    </div>
  );
}
