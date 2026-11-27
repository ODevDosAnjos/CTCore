import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const openapi = parse(readFileSync(join(process.cwd(), "../docs/openapi.yaml"), "utf8"));
const send = (method: string, path: string, body?: unknown) =>
  fetch(`/api/v1${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const declared = (path: string, method: string) => Object.keys(openapi.paths[path][method].responses);

describe("duas etapas x OpenAPI (CA25)", () => {
  it("login com duas etapas devolve TwoFactorRequired; o segundo passo devolve SessionView com twoFactor", async () => {
    const first = await (await send("POST", "/auth/login", { email: "duas@exemplo.com", password: "x" })).json();
    for (const k of openapi.components.schemas.TwoFactorRequired.required) expect(first).toHaveProperty(k);
    const bad = await send("POST", "/auth/login/two-factor", { ticket: first.ticket, code: "000000" });
    expect(bad.status).toBe(401);
    expect(declared("/auth/login/two-factor", "post")).toContain("401");
    expect((await bad.json()).code).toBe("INVALID_TWO_FACTOR_CODE");
    expect((await send("POST", "/auth/login/two-factor", { ticket: first.ticket, code: "limite" })).status).toBe(429);
    const ok = await send("POST", "/auth/login/two-factor", { ticket: first.ticket, code: "123456" });
    const view = await ok.json();
    for (const k of openapi.components.schemas.SessionView.required) expect(view).toHaveProperty(k);
    for (const k of openapi.components.schemas.TwoFactorState.required) expect(view.twoFactor).toHaveProperty(k);
    expect((await send("POST", "/auth/login/two-factor", { ticket: first.ticket, code: "123456" })).status).toBe(401);
  });

  it("setup, enable, códigos novos, desligar e reauth respondem o que o contrato declara", async () => {
    await send("POST", "/auth/login", { email: "coord@exemplo.com", password: "x" });
    const setup = await (await send("POST", "/auth/two-factor/setup")).json();
    for (const k of openapi.components.schemas.TwoFactorSetup.required) expect(setup).toHaveProperty(k);
    expect((await send("POST", "/auth/two-factor/enable", { code: "000000" })).status).toBe(401);
    const enabled = await (await send("POST", "/auth/two-factor/enable", { code: "123456" })).json();
    expect(enabled.backupCodes).toHaveLength(10);
    expect((await send("POST", "/auth/two-factor/setup")).status).toBe(409);
    expect(declared("/auth/two-factor/setup", "post")).toContain("409");

    const codes = await (await send("POST", "/auth/two-factor/backup-codes")).json();
    expect(codes.backupCodes).toHaveLength(10);
    expect(declared("/auth/two-factor/backup-codes", "post")).toEqual(["200", "401", "409"]);

    const reauth = await (await send("POST", "/auth/reauth", { action: "FULL_EXPORT", password: "x", code: "123456" })).json();
    for (const k of openapi.components.schemas.ReauthToken.required) expect(reauth).toHaveProperty(k);
    expect((await send("POST", "/auth/reauth", { action: "FULL_EXPORT", password: "x" })).status).toBe(401);
    expect((await send("POST", "/auth/reauth", { password: "x" })).status).toBe(400);

    // Coordenador é obrigado: não desliga (403).
    expect((await send("DELETE", "/auth/two-factor", { password: "x", code: "123456" })).status).toBe(403);
    expect(declared("/auth/two-factor", "delete")).toEqual(expect.arrayContaining(["204", "401", "403", "409", "429"]));
  });

  it("#628: a exigência dos Administradores segue o contrato, obriga a sessão deles e recusa o desligamento", async () => {
    const path = "/organization/admin-two-factor";
    expect((await send("GET", path)).status).toBe(401);
    await send("POST", "/auth/login", { email: "ana@exemplo.com", password: "x" });
    const initial = await (await send("GET", path)).json();
    expect(initial).toEqual({ required: false, lastChange: null });
    for (const k of openapi.components.schemas.AdminTwoFactorPolicy.required) expect(initial).toHaveProperty(k);
    expect((await send("PUT", path, { required: "true" })).status).toBe(400);
    expect(declared(path, "put")).toEqual(["200", "400", "401", "403"]);
    expect((await (await send("PUT", path, { required: true })).json()).lastChange.by).toBe("Ana");

    const admin = await (await send("POST", "/auth/login", { email: "admin@exemplo.com", password: "x" })).json();
    expect(admin.twoFactor).toMatchObject({ enabled: false, required: true });
    expect((await (await send("GET", "/auth/session")).json()).twoFactor.required).toBe(true);
    expect((await send("GET", path)).status).toBe(403);
    expect((await send("PUT", path, { required: false })).status).toBe(403);
    await send("POST", "/auth/two-factor/enable", { code: "123456" });
    expect((await send("DELETE", "/auth/two-factor", { password: "x", code: "123456" })).status).toBe(403);
    const teacher = await (await send("POST", "/auth/login", { email: "prof@exemplo.com", password: "x" })).json();
    expect(teacher.twoFactor.required).toBe(false);
  });

  it("quem não é obrigado desliga com senha e código; sem sessão tudo dá 401", async () => {
    expect((await send("POST", "/auth/two-factor/setup")).status).toBe(401);
    expect((await send("POST", "/auth/reauth", { action: "FULL_EXPORT", password: "x" })).status).toBe(401);
    await send("POST", "/auth/login", { email: "ana@exemplo.com", password: "x" });
    await send("POST", "/auth/two-factor/enable", { code: "123456" });
    expect((await send("DELETE", "/auth/two-factor", { password: "x", code: "123456" })).status).toBe(204);
  });
});

describe("trocar de aparelho e contagem x OpenAPI (issue 764)", () => {
  const login = async (email: string) => {
    const first = await (await send("POST", "/auth/login", { email, password: "x" })).json();
    if (first.ticket) await send("POST", "/auth/login/two-factor", { ticket: first.ticket, code: "123456" });
  };
  const remaining = async () => (await (await send("GET", "/auth/session")).json()).twoFactor.backupCodesRemaining;

  it("as duas rotas respondem o que o contrato declara", async () => {
    const body = { password: "x", code: "123456" };
    expect((await send("POST", "/auth/two-factor/replace", body)).status).toBe(401);
    expect((await send("POST", "/auth/two-factor/replace/confirm", { code: "123456" })).status).toBe(401);
    await login("a@b.c");
    expect(await remaining()).toBe(0);
    expect((await send("POST", "/auth/two-factor/replace", body)).status).toBe(409);

    await login("duas@exemplo.com");
    expect((await send("POST", "/auth/two-factor/replace/confirm", { code: "123456" })).status).toBe(409);
    expect((await send("POST", "/auth/two-factor/replace", { ...body, password: "errada" })).status).toBe(401);
    expect((await send("POST", "/auth/two-factor/replace", { ...body, code: "000000" })).status).toBe(401);
    expect((await send("POST", "/auth/two-factor/replace", { ...body, password: "limite" })).status).toBe(429);
    const setup = await (await send("POST", "/auth/two-factor/replace", body)).json();
    for (const k of openapi.components.schemas.TwoFactorSetup.required) expect(setup).toHaveProperty(k);
    expect((await send("POST", "/auth/two-factor/replace/confirm", { code: "000000" })).status).toBe(401);
    expect((await send("POST", "/auth/two-factor/replace/confirm", { code: "123456" })).status).toBe(204);
    expect(declared("/auth/two-factor/replace", "post")).toEqual(expect.arrayContaining(["200", "401", "409", "429"]));
    expect(declared("/auth/two-factor/replace/confirm", "post")).toEqual(expect.arrayContaining(["204", "401", "409"]));
  });

  it("a contagem começa em 8, cai com o código de reserva e volta a 10 com códigos novos", async () => {
    await login("duas@exemplo.com");
    expect(await remaining()).toBe(8);
    await send("POST", "/auth/two-factor/replace", { password: "x", code: "RESERVA001" });
    expect(await remaining()).toBe(7);
    await send("POST", "/auth/two-factor/backup-codes");
    expect(await remaining()).toBe(10);
  });
});
