import type { ReactNode } from "react";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { PortalLayout } from "@/features/portal/PortalLayout";

const MANAGEMENT = ["COORDINATOR", "ADMINISTRATOR", "TEACHER"];

// Casca do app para a tela "Sem acesso": gestão com menu e barra, os demais perfis com a do portal (D3).
export function AreaUnavailableShell({ role, children }: { role: string; children: ReactNode }) {
  return MANAGEMENT.includes(role) ? <ManagementLayout>{children}</ManagementLayout> : <PortalLayout>{children}</PortalLayout>;
}
