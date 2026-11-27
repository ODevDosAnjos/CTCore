import { formatCep, formatCpfCnpj, onlyDigits } from "@/components/fields/masks";
import { FEE_KEYS, type FeeKey, type TeacherKey, type UnitDetail, type UnitReminders, type UnitUpdate } from "./useUnitSettings";

// Rascunho único das cinco abas: textos como o usuário vê; a conversão para o corpo do PUT fica em toBody.
export type Draft = {
  name: string;
  cnpj: string;
  legalName: string;
  postalCode: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  phone: string;
  whatsapp: string;
  email: string;
  dueDays: number[];
  enrollmentFeeEnabled: boolean;
  enrollmentFeeCents: number | null;
  fees: Record<FeeKey, number | null>;
  pixKey: string;
  reminders: ReminderDrafts;
  remindersEnabled: boolean;
  remindersHour: number;
  teacher: Record<TeacherKey, boolean>;
  directoryEnabled: boolean;
  trialLinkEnabled: boolean;
  selfRegistrationLinkEnabled: boolean;
  trialLimit: number;
};

/** Lembretes com dia ajustável e o maior dia de cada um (RN-COB-17); o do dia do vencimento só liga e desliga. */
export const REMINDER_MAX = { before: 30, afterFirst: 60, afterSecond: 60 } as const;
export type ReminderDayKey = keyof typeof REMINDER_MAX;
export type ReminderDrafts = Record<ReminderDayKey, { enabled: boolean; days: string }> & { due: { enabled: boolean } };

const draftReminders = (r: UnitReminders): ReminderDrafts => ({
  before: { enabled: r.before.enabled, days: String(r.before.days) },
  due: r.due,
  afterFirst: { enabled: r.afterFirst.enabled, days: String(r.afterFirst.days) },
  afterSecond: { enabled: r.afterSecond.enabled, days: String(r.afterSecond.days) },
});
const bodyReminders = (r: ReminderDrafts): UnitReminders => ({
  before: { enabled: r.before.enabled, days: Number(r.before.days) },
  due: r.due,
  afterFirst: { enabled: r.afterFirst.enabled, days: Number(r.afterFirst.days) },
  afterSecond: { enabled: r.afterSecond.enabled, days: Number(r.afterSecond.days) },
});
export const isReminderDay = (key: ReminderDayKey, text: string) => /^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= REMINDER_MAX[key];

export type SetDraft = <K extends keyof Draft>(key: K) => (value: Draft[K]) => void;
/** Erros por campo: do que o usuário digitou (`problems`) ou da resposta 400 (`errors`, pela chave do servidor). */
export type Problems = Partial<Record<"name" | "cnpj" | "postalCode" | "coordinates" | "phone" | "whatsapp" | "email" | "dueDays" | `reminders.${ReminderDayKey}`, string>>;
export type TabProps = { d: Draft; set: SetDraft; problems: Problems; errors: Record<string, string> };

export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const KEY_DIGITS = /^\d{11}$|^\d{14}$/;

export function toDraft(d: UnitDetail): Draft {
  const s = d.settings;
  return {
    name: d.name,
    cnpj: d.cnpj ? formatCpfCnpj(d.cnpj) : "",
    legalName: d.legalName ?? "",
    postalCode: d.postalCode ? formatCep(d.postalCode) : "",
    address: d.address ?? "",
    city: d.city ?? "",
    latitude: d.latitude === null ? "" : String(d.latitude),
    longitude: d.longitude === null ? "" : String(d.longitude),
    phone: d.phone ?? "",
    whatsapp: d.whatsapp ?? "",
    email: d.email ?? "",
    dueDays: s.dueDays,
    enrollmentFeeEnabled: s.enrollmentFeeEnabled,
    enrollmentFeeCents: s.enrollmentFeeCents,
    fees: s.feesCents,
    pixKey: s.pixKey && KEY_DIGITS.test(s.pixKey) ? formatCpfCnpj(s.pixKey) : (s.pixKey ?? ""),
    reminders: draftReminders(s.reminders),
    remindersEnabled: s.remindersEnabled,
    remindersHour: s.remindersHour,
    teacher: s.teacherPermissions,
    directoryEnabled: s.directoryEnabled,
    trialLinkEnabled: s.trialLinkEnabled,
    selfRegistrationLinkEnabled: s.selfRegistrationLinkEnabled,
    trialLimit: s.trialLimit,
  };
}

export const coordinate = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
const blankToNull = (v: string) => (v.trim() === "" ? null : v.trim());

// PUT completo (D10). Com CEP novo e coordenadas intocadas, elas vão vazias para o servidor buscar as do CEP (D3).
export function toBody(d: Draft, base: Draft): UnitUpdate {
  const cepChanged = onlyDigits(d.postalCode) !== onlyDigits(base.postalCode);
  const coordsTouched = d.latitude !== base.latitude || d.longitude !== base.longitude;
  const useCep = cepChanged && !coordsTouched;
  return {
    name: d.name.trim(),
    cnpj: blankToNull(onlyDigits(d.cnpj)),
    legalName: blankToNull(d.legalName),
    postalCode: blankToNull(onlyDigits(d.postalCode)),
    address: blankToNull(d.address),
    city: blankToNull(d.city),
    latitude: useCep ? null : coordinate(d.latitude),
    longitude: useCep ? null : coordinate(d.longitude),
    phone: blankToNull(d.phone),
    email: blankToNull(d.email),
    whatsapp: blankToNull(d.whatsapp),
    settings: {
      dueDays: d.dueDays,
      enrollmentFeeEnabled: d.enrollmentFeeEnabled,
      enrollmentFeeCents: d.enrollmentFeeEnabled ? (d.enrollmentFeeCents ?? 0) : 0,
      feesCents: Object.fromEntries(FEE_KEYS.map((k) => [k, d.fees[k] ?? 0])) as Record<FeeKey, number>,
      pixKey: blankToNull(d.pixKey),
      reminders: bodyReminders(d.reminders),
      remindersEnabled: d.remindersEnabled,
      remindersHour: d.remindersHour,
      teacherPermissions: d.teacher,
      directoryEnabled: d.directoryEnabled,
      trialLinkEnabled: d.trialLinkEnabled,
      selfRegistrationLinkEnabled: d.selfRegistrationLinkEnabled,
      trialLimit: d.trialLimit,
    },
  };
}
