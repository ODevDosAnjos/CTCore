import { Navigate, Outlet, useLocation } from "react-router";
import { ErrorState, LoadingState } from "@/components/states";
import { ChooseLinkGate } from "./ChooseLinkGate";
import { useSession } from "./SessionProvider";

export function RequireSession() {
  const { state, refresh } = useSession();
  const { pathname, search } = useLocation();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState onRetry={() => void refresh()} />;
  // saiu de propósito (useLogout): /entrar limpo, sem `next` (D2)
  if (state.status === "anon" && state.out) return <Navigate to="/entrar" replace />;
  if (state.status === "anon") return <Navigate to={`/entrar?${new URLSearchParams({ next: pathname + search })}`} replace />;
  return (
    <>
      <Outlet />
      <ChooseLinkGate />
    </>
  );
}
