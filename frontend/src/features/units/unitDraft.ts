import { formatCep, formatCpfCnpj, onlyDigits } from "@/components/fields/masks";
import { FEE_KEYS, type FeeKey, type TeacherKey, type UnitDetail, type UnitUpdate } from "./useUnitSettings";

// Rascunho único das cinco abas: textos como o usuário vê; a conversão para o corpo do PUT fica em toBody.
export type Draft = {
  name: string;
  cnpj: string;
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
  reminderDays: number[];
  remindersEnabled: boolean;
  remindersHour: number;
  teacher: Record<TeacherKey, boolean>;
  directoryEnabled: boolean;
  trialLinkEnabled: boolean;
  selfRegistrationLinkEnabled: boolean;
  trialLimit: number;
};

export type SetDraft = <K extends keyof Draft>(key: K) => (value: Draft[K]) => void;
/** Erros por campo: do que o usuário digitou (`problems`) ou da resposta 400 (`errors`, pela chave do servidor). */
export type Problems = Partial<Record<"name" | "cnpj" | "postalCode" | "coordinates" | "phone" | "whatsapp" | "email" | "dueDays", string>>;
export type TabProps = { d: Draft; set: SetDraft; problems: Problems; errors: Record<string, string> };

export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const MAX_REMINDERS = 8;
// Dias de lembrete que têm interruptor próprio (RN-COB-17): negativo é antes, positivo é depois do vencimento.
export const STANDARD_REMINDER_DAYS = [-3, 0, 3, 10] as const;

const KEY_DIGITS = /^\d{11}$|^\d{14}$/;

export function toDraft(d: UnitDetail): Draft {
  const s = d.settings;
  return {
    name: d.name,
    cnpj: d.cnpj ? formatCpfCnpj(d.cnpj) : "",
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
    reminderDays: s.reminderDays,
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
      reminderDays: d.reminderDays,
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
