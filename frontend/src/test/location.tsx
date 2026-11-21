import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

// Teste: guarda o endereço e o `navigate` do roteador (MemoryRouter não mexe em `window.location`).
const probe = { current: { pathname: "/", search: "" }, go: (() => undefined) as ReturnType<typeof useNavigate> };
export function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    probe.current = location;
    probe.go = navigate;
  });
  return null;
}
export const currentLocation = () => probe.current;
/** O botão voltar / avançar do navegador. */
export const history = (delta: number) => probe.go(delta);
/** Abre um endereço (um link ou o usuário digitando). */
export const visit = (to: string) => probe.go(to);
