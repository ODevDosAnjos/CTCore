import { HttpResponse, type HttpResponseResolver } from "msw";

// D4: força erro, carregando, vazio ou sem permissão numa leitura. Só existe com o MSW ligado (dev e teste).
// Navegador: ?estado=erro&rota=/students. Teste: globalThis.__mswEstado = { estado, rota }.
export type EstadoForcado = "erro" | "carregando" | "vazio" | "semPermissao";
const ESTADOS: EstadoForcado[] = ["erro", "carregando", "vazio", "semPermissao"];

declare global {
  var __mswEstado: { estado: EstadoForcado; rota?: string } | undefined;
}

const lido = (): { estado: EstadoForcado; rota?: string } | null => {
  if (globalThis.__mswEstado) return globalThis.__mswEstado;
  const q = new URLSearchParams(globalThis.location?.search ?? "");
  const estado = q.get("estado") as EstadoForcado | null;
  return estado && ESTADOS.includes(estado) ? { estado, rota: q.get("rota") ?? undefined } : null;
};

const body = (status: number, code: string, message: string) => HttpResponse.json({ code, message, fields: [] }, { status });

const esvazia = (v: unknown): unknown => {
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "total" ? 0 : k === "items" || Array.isArray(x) ? esvazia(x) : x]));
  }
  return v;
};

export const comEstadoForcado =
  (resolver: HttpResponseResolver): HttpResponseResolver =>
  async (info) => {
    const f = lido();
    const path = new URL(info.request.url).pathname.replace(/^\/api\/v1/, "");
    if (!f || info.request.method !== "GET" || path.startsWith("/auth") || (f.rota && !path.startsWith(f.rota))) return resolver(info);
    if (f.estado === "carregando") return new Promise<never>(() => {});
    if (f.estado === "erro") return body(500, "INTERNAL_ERROR", "Erro forçado pelo cenário.");
    if (f.estado === "semPermissao") return body(403, "FORBIDDEN", "Sem permissão (forçado pelo cenário).");
    const res = await resolver(info);
    if (!(res instanceof Response) || !res.headers.get("content-type")?.includes("json")) return res;
    return HttpResponse.json(esvazia(await res.clone().json()) as never, { status: res.status });
  };
