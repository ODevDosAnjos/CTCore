import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

// Espelha StaffUser do OpenAPI (docs/openapi.yaml, RF-ACE-06).
export interface StaffUser {
  linkId: string;
  name: string;
  email: string;
  role: "ADMINISTRATOR" | "TEACHER";
  units: { id: string; name: string }[];
  lastAccessAt: string | null;
  status: "PENDING" | "ACTIVE" | "ENDED";
  canManage: boolean;
  /** RN-ASS-21: vagas que a pessoa ocupa (0 em convite pendente e no Coordenador nomeado). */
  seats: number;
}

export const inviteUser = (body: { email: string; name: string; unitIds: string[] }) => api<StaffUser>("/users", { method: "POST", body });
export const resendInvite = (linkId: string) => api<void>(`/users/${linkId}/resend`, { method: "POST" });
export const changeUnits = (linkId: string, unitIds: string[]) => api<StaffUser>(`/users/${linkId}/units`, { method: "PUT", body: { unitIds } });
export const deactivateUser = (linkId: string) => api<void>(`/users/${linkId}`, { method: "DELETE" });
export const appointMyself = (unitIds: string[]) => api<StaffUser>("/users/coordinator-appointment", { method: "POST", body: { unitIds } });
/** RN-ASS-21: valor mensal da vaga de Administrador, em centavos (só o Coordenador). */
export const fetchSeatPrice = () => api<{ adminSeatCents: number }>("/organization/admin-seat-price").then((r) => r.adminSeatCents);

type Loaded = { tick: number; users?: StaffUser[]; price?: number; forbidden?: boolean };

// Lista de Pessoas › Administradores com o valor da vaga (D7: falha em qualquer um é erro de tela). O servidor decide quem acessa (403).
export function useUsers() {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Loaded>();

  useEffect(() => {
    let alive = true;
    Promise.all([api<StaffUser[]>("/users"), fetchSeatPrice()]).then(
      ([users, price]) => alive && setDone({ tick, users, price }),
      (e) => alive && setDone({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const current = done?.tick === tick ? done : undefined;
  const status = !current ? "loading" : current.users ? "ready" : current.forbidden ? "forbidden" : "error";
  return {
    status,
    users: current?.users,
    price: current?.price ?? 0,
    retry: () => setTick((n) => n + 1),
    // Recarrega a lista sem passar por "carregando" (depois de convidar, trocar unidades ou desativar).
    refresh: async () => {
      const users = await api<StaffUser[]>("/users");
      setDone((d) => ({ ...d, tick, users }));
    },
  } as const;
}
