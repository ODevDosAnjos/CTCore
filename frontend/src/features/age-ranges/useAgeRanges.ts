import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { LastChangeValue } from "@/components/LastChange";

// Espelham AgeRange e AgeRangeList do OpenAPI (docs/openapi.yaml).
export interface AgeRange {
  id: string;
  name: string;
  minAge: number;
  maxAge: number | null;
  usedIn: { count: number; names: string[] };
}
export interface AgeRangeInput {
  name: string;
  minAge: number;
  maxAge: number | null;
}
interface Listing {
  canManage: boolean;
  items: AgeRange[];
  lastChange: LastChangeValue | null;
}

type Loaded = { tick: number; data?: Listing; forbidden?: boolean };

// Faixas etárias de Configurações › Faixas etárias (RF-MOD-04). O servidor decide quem acessa (403) e quem altera (canManage).
export function useAgeRanges() {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Loaded>();

  useEffect(() => {
    let alive = true;
    api<Listing>("/age-ranges").then(
      (data) => alive && setDone({ tick, data }),
      (e) => alive && setDone({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const current = done?.tick === tick ? done : undefined;
  const status = !current ? "loading" : current.data ? "ready" : current.forbidden ? "forbidden" : "error";
  const sort = (items: AgeRange[]) => [...items].sort((a, b) => a.minAge - b.minAge || a.name.localeCompare(b.name));
  const change = (fn: (items: AgeRange[]) => AgeRange[]) =>
    setDone((d) => (d?.data ? { ...d, data: { ...d.data, items: sort(fn(d.data.items)) } } : d));
  // A última alteração vem da auditoria do servidor: recarrega só ela, sem tirar a lista da tela.
  const refreshLastChange = () =>
    api<Listing>("/age-ranges").then(
      (fresh) => setDone((d) => (d?.data ? { ...d, data: { ...d.data, lastChange: fresh.lastChange } } : d)),
      () => undefined,
    );

  return {
    status,
    items: current?.data?.items,
    canManage: current?.data?.canManage ?? false,
    lastChange: current?.data?.lastChange ?? null,
    retry: () => setTick((n) => n + 1),
    // Erros sobem (ApiError) para a janela mostrar; a lista reflete a mudança sem recarregar.
    create: async (input: AgeRangeInput) => {
      const created = await api<AgeRange>("/age-ranges", { method: "POST", body: input });
      change((items) => [...items, created]);
      void refreshLastChange();
    },
    update: async (id: string, input: AgeRangeInput) => {
      const updated = await api<AgeRange>(`/age-ranges/${id}`, { method: "PUT", body: input });
      change((items) => items.map((r) => (r.id === id ? updated : r)));
      void refreshLastChange();
    },
    remove: async (id: string) => {
      await api<void>(`/age-ranges/${id}`, { method: "DELETE" });
      change((items) => items.filter((r) => r.id !== id));
      void refreshLastChange();
    },
  } as const;
}
