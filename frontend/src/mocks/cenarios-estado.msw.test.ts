import { resetMockSession, scenariosEnabled, setScenarios } from "./handlers";

const json = { "Content-Type": "application/json" };
const login = (email: string) => fetch("/api/v1/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password: "segredo123" }) });
const forca = (estado: string, rota?: string) => {
  globalThis.__mswEstado = { estado: estado as never, rota };
};

afterEach(() => {
  globalThis.__mswEstado = undefined;
});

describe("cenários do MSW: liga e desliga (#449, CA1)", () => {
  it("vem desligado e a lista é a de hoje", async () => {
    expect(scenariosEnabled()).toBe(false);
    await login("ana@exemplo.com");
    const body = await (await fetch("/api/v1/students")).json();
    expect(body.items).toHaveLength(2);
  });

  it("ligado, resetMockSession() mantém o cenário ligado", () => {
    setScenarios(true);
    resetMockSession();
    expect(scenariosEnabled()).toBe(true);
  });
});

describe("estado forçado (#449, CA3, D4)", () => {
  beforeEach(() => login("ana@exemplo.com"));

  it("sem o parâmetro nada muda", async () => {
    const res = await fetch("/api/v1/students");
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(2);
  });

  it("erro devolve 500 e semPermissao devolve 403", async () => {
    forca("erro");
    expect((await fetch("/api/v1/students")).status).toBe(500);
    forca("semPermissao");
    expect((await fetch("/api/v1/students")).status).toBe(403);
  });

  it("vazio devolve items vazio com total 0", async () => {
    forca("vazio");
    const body = await (await fetch("/api/v1/students")).json();
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("carregando deixa a leitura pendente", async () => {
    forca("carregando");
    const r = await Promise.race([fetch("/api/v1/students").then(() => "respondeu"), new Promise((ok) => setTimeout(() => ok("pendente"), 300))]);
    expect(r).toBe("pendente");
  });

  it("rota limita o estado ao prefixo; escrita e /auth não são afetados", async () => {
    forca("erro", "/charges");
    expect((await fetch("/api/v1/students")).status).toBe(200);
    expect((await fetch("/api/v1/charges")).status).toBe(500);
    forca("erro");
    expect((await login("ana@exemplo.com")).status).toBe(200);
  });
});
