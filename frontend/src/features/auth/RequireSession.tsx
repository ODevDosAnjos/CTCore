import { Navigate, Outlet, useLocation } from "react-router";
import { ErrorState, LoadingState } from "@/components/states";
import { ChooseLinkPage } from "./ChooseLinkPage";
import { useSession } from "./SessionProvider";

export function RequireSession() {
  const { state, refresh } = useSession();
  const { pathname, search } = useLocation();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState onRetry={() => void refresh()} />;
  // saiu de propósito (useLogout): /entrar limpo, sem `next` (D2)
  // RN-ACE-23: outro aparelho entrou na gestão: /entrar limpo, com o aviso
  if (state.status === "anon" && (state.out || state.replaced)) return <Navigate to="/entrar" replace />;
  if (state.status === "anon") return <Navigate to={`/entrar?${new URLSearchParams({ next: pathname + search })}`} replace />;
  // RN-ACE-03: vários vínculos e nenhum ativo → a página de escolha no lugar do app; só sai com a escolha ou com Sair.
  if (state.status === "ready" && state.session.links.length > 1 && !state.session.activeLinkId) return <ChooseLinkPage />;
  return <Outlet />;
}
