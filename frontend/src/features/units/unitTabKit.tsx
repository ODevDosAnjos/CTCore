import { render } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { toDraft, type Draft, type SetDraft, type TabProps } from "./unitDraft";
import type { UnitDetail } from "./useUnitSettings";

// Só para os testes das abas: um pai com o rascunho, como na página, para ver o que a aba grava nele.
export const unitFixture = (settings: Partial<UnitDetail["settings"]> = {}): UnitDetail => ({
  id: "00000000-0000-0000-0000-00000000000a",
  name: "Tijuca",
  shortName: "tijuca",
  postalCode: null,
  address: null,
  city: null,
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  whatsapp: null,
  cnpj: null,
  legalName: null,
  active: true,
  timezone: "America/Sao_Paulo",
  version: 0,
  lastChange: null,
  settings: {
    dueDays: [1, 5, 10, 15],
    enrollmentFeeEnabled: false,
    enrollmentFeeCents: 0,
    feesCents: { cash: 0, pix: 0, bankSlip: 0, creditCard: 0, debitCard: 0, automaticDebit: 0, manualPix: 0, terminalCard: 0, transfer: 0 },
    pixKey: null,
    paymentAccount: "NOT_CONNECTED",
    reminders: {
      before: { enabled: true, days: 3 },
      due: { enabled: true },
      afterFirst: { enabled: true, days: 3 },
      afterSecond: { enabled: true, days: 10 },
    },
    remindersEnabled: true,
    remindersHour: 9,
    teacherPermissions: { announcements: true, agendaEdit: true, studentContacts: true, trialClasses: true, studentRecord: false },
    directoryEnabled: false,
    trialLinkEnabled: true,
    selfRegistrationLinkEnabled: true,
    trialLimit: 2,
    ...settings,
  },
});

export function renderTab(tab: (p: TabProps) => ReactNode, unit: UnitDetail = unitFixture(), errors: Record<string, string> = {}, problems: TabProps["problems"] = {}) {
  let current: Draft = toDraft(unit);
  function Harness() {
    const [d, setD] = useState(current);
    current = d;
    const set: SetDraft = (k) => (v) => setD((p) => ({ ...p, [k]: v }));
    return <>{tab({ d, set, problems, errors })}</>;
  }
  const view = render(
    <ThemeProvider>
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return { ...view, draft: () => current };
}
