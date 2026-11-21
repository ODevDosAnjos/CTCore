import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildTabs } from "@/features/permissions/buildTabs";
import { menuCatalog } from "@/features/permissions/menuCatalog";
import { notificationTarget } from "@/features/notifications/notificationActions";
import type { NotificationType } from "@/features/notifications/useNotifications";
import { mockPermissions } from "@/mocks/permissions";
import { findRoute } from "@/routes";

// RNF-56 (#677): toda tela com moldura tem rota no mapa (`routes.ts`); o App, o menu, as abas e as notificações só apontam para ele.
// Fora do mapa ficam só as telas de acesso e públicas, sem moldura nem menu (D3).
const FIXAS = ["/entrar", "/esqueci-senha", "/redefinir-senha/:code", "/convite/:code", "/recibo/:codigo", "/portal/termo", "/dev/vitrine", "*"];

/** Endereços literais de `<Route path="...">`; `P("id")` e `{constante}` passam. */
const literais = (fonte: string) => [...fonte.matchAll(/<Route\s[^>]*?path="([^"]*)"/g)].map((m) => m[1]).filter((p) => !FIXAS.includes(p));

const semRota = (href: string) => (findRoute(href) ? [] : [href]);

describe("RNF-56: padrão de rotas", () => {
  it("CA5: o App só tem endereço literal da lista fixa", () => {
    expect(literais(readFileSync("src/App.tsx", "utf8"))).toEqual([]);
  });

  it("CA5: reprova endereço novo fora do mapa", () => {
    expect(literais('<Route path="/novo-endereco" element={<X />} />')).toEqual(["/novo-endereco"]);
    expect(literais('<Route path={P("home")} element={<X />} /><Route path="/entrar" element={<X />} />')).toEqual([]);
  });

  it("CA6: cada item do menu disponível tem a rota dele no mapa", () => {
    const itens = menuCatalog.flatMap((g) => g.items).filter((i) => i.available);
    expect(itens.length).toBeGreaterThan(10);
    expect(itens.filter((i) => findRoute(i.href)?.id !== i.id).map((i) => i.id)).toEqual([]);
  });

  it("CA6: as abas do celular da gestão têm rota", () => {
    const t = (k: string) => k;
    const hrefs = ["COORDINATOR", "ADMINISTRATOR", "TEACHER"].flatMap((role) => buildTabs(mockPermissions(role), role, t).filter((x) => !x.disabled).map((x) => x.href));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.flatMap(semRota)).toEqual([]);
  });

  it("CA6: as abas do portal têm rota", () => {
    const hrefs = [...readFileSync("src/features/portal/PortalTabs.tsx", "utf8").matchAll(/\bto: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBe(5);
    expect(hrefs.flatMap(semRota)).toEqual([]);
  });

  it("CA6: todo tipo de notificação leva a uma rota do mapa", () => {
    const tipos: NotificationType[] = ["PAYMENT_RECEIVED", "HIGH_BENEFIT", "STUDENT_MAJORITY", "EMAIL_PROBLEM", "INVITE_PENDING", "CLOSURE_REQUEST", "MP_DISCONNECTED", "SUBSCRIPTION_OVERDUE", "PORTAL_REQUEST", "PAYMENT_PROOF"];
    const hrefs = tipos.flatMap((type) => [notificationTarget({ type, refType: null, refId: null }), notificationTarget({ type, refType: "student", refId: "x" })]);
    expect(hrefs.flatMap(semRota)).toEqual([]);
  });

  it("CA6: reprova destino fora do mapa", () => {
    expect(semRota("/nao-existe")).toEqual(["/nao-existe"]);
  });
});
