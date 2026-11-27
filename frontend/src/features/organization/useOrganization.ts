import { useEffect, useState } from "react";
import type { LastChangeValue } from "@/components/LastChange";
import { api, ApiError } from "@/lib/api";

export type CrossUnitTraining = "plan" | "allowed" | "denied";
// RF-ORG-01 / RN-ORG-13: as quatro regras da organização (OrganizationRules do OpenAPI).
export interface OrganizationRules {
  deactivationDays: number;
  formerStudentRetentionMonths: number;
  trialRetentionMonths: number;
  crossUnitTraining: CrossUnitTraining;
}
export interface Coordinator {
  name: string | null;
  email: string;
  twoFactorEnabled: boolean;
}

// Espelha OrganizationView do OpenAPI (docs/openapi.yaml). `logoUrl` é a URL temporária assinada.
export interface OrganizationView {
  name: string;
  color: string | null;
  holderDocument: string | null;
  logoUrl: string | null;
  version: number;
  lastChange: LastChangeValue | null;
  rules: OrganizationRules;
  coordinator: Coordinator | null;
}
export interface OrganizationUpdate {
  name: string;
  holderDocument: string | null;
  rules?: OrganizationRules;
}

type Loaded = { tick: number; view?: OrganizationView; forbidden?: boolean };

// Consulta e mutações de Configurações › Organização (RF-ORG-01). O servidor decide quem escreve (403).
export function useOrganization() {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Loaded>();

  useEffect(() => {
    let alive = true;
    api<OrganizationView>("/organization").then(
      (view) => alive && setDone({ tick, view }),
      (e) => alive && setDone({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const current = done?.tick === tick ? done : undefined;
  const status = !current ? "loading" : current.view ? "ready" : current.forbidden ? "forbidden" : "error";

  // Cada mutação devolve a visão nova; erros sobem (ApiError) para a tela apontar o campo.
  const apply = async (request: Promise<OrganizationView>) => {
    const view = await request;
    setDone({ tick, view });
    return view;
  };
  return {
    status,
    view: current?.view,
    retry: () => setTick((n) => n + 1),
    // RNF-15: sem versão explícita vai a lida; "Sobrescrever" manda a versão atual consultada.
    save: (body: OrganizationUpdate, version = current?.view?.version) =>
      apply(api<OrganizationView>("/organization", { method: "PATCH", body, headers: { "If-Match": String(version) } })),
    fetchCurrent: () => api<OrganizationView>("/organization"),
    adopt: (view: OrganizationView) => setDone({ tick, view }),
    uploadLogo: (logo: Blob) => {
      const form = new FormData();
      form.append("file", logo, "logo.png");
      return apply(api<OrganizationView>("/organization/logo", { method: "PUT", body: form }));
    },
    removeLogo: () => apply(api<OrganizationView>("/organization/logo", { method: "DELETE" })),
  } as const;
}
