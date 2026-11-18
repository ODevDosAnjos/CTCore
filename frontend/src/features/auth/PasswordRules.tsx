import { Check, Circle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// RN-ACE-08: o servidor é quem decide; aqui só a ajuda ao digitar. Reutilizado pela nova senha e pelo convite.
export const RULE_KEYS = ["length", "number", "upper"] as const;
export type RuleKey = (typeof RULE_KEYS)[number];

export function checkPassword(password: string): Record<RuleKey, boolean> {
  return { length: password.length >= 8, number: /\d/.test(password), upper: /\p{Lu}/u.test(password) };
}

export const isStrongPassword = (password: string) => Object.values(checkPassword(password)).every(Boolean);

type State = "met" | "pending" | "failed";
const ICON = { met: Check, pending: Circle, failed: X } as const;
const TONE = { met: "text-ok-foreground", pending: "text-muted-foreground", failed: "text-danger-foreground" } as const;

// D5: o vazamento só o servidor sabe; a regra fica neutra até a recusa (`leaked`), quando vira ✗.
export function PasswordRules({ password, id, leaked = false }: { password: string; id?: string; leaked?: boolean }) {
  const { t } = useTranslation();
  const result = checkPassword(password);
  const rows: { key: string; state: State }[] = [
    ...RULE_KEYS.map((key) => ({ key, state: (result[key] ? "met" : "pending") as State })),
    { key: "leak", state: leaked ? "failed" : "pending" },
  ];
  return (
    <ul id={id} aria-label={t("password.rules.title")} aria-live="polite" className="space-y-1 text-sm">
      {rows.map(({ key, state }) => {
        const Icon = ICON[state];
        return (
          <li key={key} className={`flex items-center gap-2 ${TONE[state]}`}>
            <Icon aria-hidden className="size-4 shrink-0" />
            <span>{t(`password.rules.${key}`)}</span>
            <span className="sr-only">: {t(`password.rules.${state}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}
