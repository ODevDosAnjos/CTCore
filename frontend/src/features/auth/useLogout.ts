import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { useSession } from "./SessionProvider";

// Sai da conta: POST /auth/logout; só em sucesso limpa a sessão e vai para /entrar sem `next` (D2).
export function useLogout() {
  const { clear } = useSession();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function logout() {
    setPending(true);
    setFailed(false);
    try {
      await api<void>("/auth/logout", { method: "POST" });
      navigate("/entrar", { replace: true });
      clear();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }
  return { logout: () => void logout(), pending, failed };
}
