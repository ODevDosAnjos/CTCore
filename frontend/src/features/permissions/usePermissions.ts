import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/features/auth/SessionProvider";
import { api } from "@/lib/api";
import type { PermissionMap } from "./types";

// Permissões efetivas do vínculo ativo (GET /permissions); refeitas ao trocar de vínculo ou ao tentar de novo.
// Quem lê é só a moldura da gestão (RNF-43, R2): as telas e os guardas leem o contexto com `usePermissions`.
export function useLoadPermissions() {
  const { state } = useSession();
  const linkId = state.status === "ready" ? (state.session.activeLinkId ?? "") : "";
  const [tick, setTick] = useState(0);
  const key = `${linkId}:${tick}`;
  const [done, setDone] = useState<{ key: string; permissions?: PermissionMap }>();

  useEffect(() => {
    let alive = true;
    api<{ permissions: PermissionMap }>("/permissions").then(
      (v) => alive && setDone({ key, permissions: v.permissions }),
      () => alive && setDone({ key }),
    );
    return () => {
      alive = false;
    };
  }, [key]);

  const current = done?.key === key ? done : undefined;
  const status = !current ? "loading" : current.permissions ? "ready" : "error";
  return { status, permissions: current?.permissions, retry: () => setTick((n) => n + 1) } as const;
}

export type PermissionsValue = ReturnType<typeof useLoadPermissions>;
export const PermissionsContext = createContext<PermissionsValue | null>(null);

/** Permissões lidas uma vez pela moldura da gestão; sem moldura (portal, telas públicas) o contexto é nulo. */
export const useOptionalPermissions = () => useContext(PermissionsContext);

export function usePermissions(): PermissionsValue {
  const value = useContext(PermissionsContext);
  if (!value) throw new Error("usePermissions fora da moldura da gestão");
  return value;
}
