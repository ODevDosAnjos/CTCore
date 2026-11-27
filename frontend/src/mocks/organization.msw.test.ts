import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const openapi = parse(readFileSync(join(process.cwd(), "../docs/openapi.yaml"), "utf8"));
const json = { "Content-Type": "application/json" };
const login = async (email: string, linkId?: string) => {
  await fetch("/api/v1/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password: "segredo123" }) });
  if (linkId) await fetch("/api/v1/auth/session/link", { method: "PUT", headers: json, body: JSON.stringify({ linkId }) });
};
const CENTRO = "00000000-0000-0000-0000-000000000021";
const get = () => fetch("/api/v1/organization");
// Sem versão explícita lê a atual (RNF-15); null omite o If-Match.
const patch = async (body: unknown, ifMatch?: string | null) => {
  const version = ifMatch === undefined ? String((await (await get()).json()).version) : ifMatch;
  return fetch("/api/v1/organization", { method: "PATCH", headers: version === null ? json : { ...json, "If-Match": version }, body: JSON.stringify(body) });
};
// FormData e File do jsdom não passam pelo fetch do Node; o corpo multipart vai montado à mão.
const putLogo = (size = 10) =>
  fetch("/api/v1/organization/logo", {
    method: "PUT",
    headers: { "Content-Type": "multipart/form-data; boundary=x" },
    body: `--x\r\nContent-Disposition: form-data; name="file"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n${"a".repeat(size)}\r\n--x--\r\n`,
  });
const deleteLogo = () => fetch("/api/v1/organization/logo", { method: "DELETE" });

describe("organização x OpenAPI (CA21)", () => {
  const declared = (path: string, method: string) => Object.keys(openapi.paths[path][method].responses);

  it("sem sessão as quatro rotas respondem o 401 do contrato", async () => {
    for (const [res, path, method] of [
      [await get(), "/organization", "get"],
      [await patch({ name: "x" }), "/organization", "patch"],
      [await putLogo(), "/organization/logo", "put"],
      [await deleteLogo(), "/organization/logo", "delete"],
    ] as const) {
      expect(res.status).toBe(401);
      expect(declared(path, method)).toContain("401");
    }
  });

  it("Coordenador: leitura traz exatamente as chaves do contrato; escrita 200 e erros 400 com o campo", async () => {
    await login("ana@exemplo.com");
    const required: string[] = openapi.components.schemas.OrganizationView.required;
    const read = await (await get()).json();
    expect(Object.keys(read).sort()).toEqual([...required].sort());
    expect(Object.keys(openapi.components.schemas.OrganizationView.properties).sort()).toEqual([...required].sort());

    const saved = await patch({ name: " Dojo ", color: "#1A56DB", holderDocument: "11.222.333/0001-81" });
    expect(saved.status).toBe(200);
    const body = await saved.json();
    expect(body).toMatchObject({ name: "Dojo", holderDocument: "11222333000181", logoUrl: null, version: 1 });
    expect(body).not.toHaveProperty("color");
    expect(await (await get()).json()).toMatchObject({ name: "Dojo" });

    // A cor saiu (#758): mandada por engano, válida ou não, é ignorada e sozinha não sobe a versão.
    for (const color of ["#1a56db", "#ffeb3b", "azul"]) {
      const ignored = await patch({ name: "Dojo", color, holderDocument: "11.222.333/0001-81" });
      expect(ignored.status).toBe(200);
      expect(await ignored.json()).toEqual(body);
    }

    const invalid = [
      [{ name: "" }, "name"],
      [{ name: "ok", holderDocument: "123" }, "holderDocument"],
    ] as const;
    for (const [body, field] of invalid) {
      const res = await patch(body);
      expect(res.status).toBe(400);
      expect(declared("/organization", "patch")).toContain("400");
      const err = await res.json();
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.fields.map((f: { field: string }) => f.field)).toContain(field);
    }

    const withLogo = await putLogo();
    expect(withLogo.status).toBe(200);
    expect((await withLogo.json()).logoUrl).toMatch(/^data:image\/png/);
    expect((await putLogo(6 * 1024 * 1024)).status).toBe(400);
    const without = await deleteLogo();
    expect(without.status).toBe(200);
    expect((await without.json()).logoUrl).toBeNull();
    expect((await deleteLogo()).status).toBe(200);
  });

  it("Administrador lê, mas PATCH, PUT e DELETE respondem 403 e nada muda; Professor e portal recebem 403 na leitura", async () => {
    await login("varios@exemplo.com", "00000000-0000-0000-0000-000000000011");
    expect((await get()).status).toBe(200);
    for (const [res, path, method] of [
      [await patch({ name: "Hack" }), "/organization", "patch"],
      [await putLogo(), "/organization/logo", "put"],
      [await deleteLogo(), "/organization/logo", "delete"],
    ] as const) {
      expect(res.status).toBe(403);
      expect((await res.json()).code).toBe("FORBIDDEN");
      expect(declared(path, method)).toContain("403");
    }
    expect((await (await get()).json()).name).toBe("Academia Alfa");
    for (const link of ["00000000-0000-0000-0000-000000000012", "00000000-0000-0000-0000-000000000013"]) {
      await fetch("/api/v1/auth/session/link", { method: "PUT", headers: json, body: JSON.stringify({ linkId: link }) });
      const res = await get();
      expect(res.status).toBe(403);
      expect(declared("/organization", "get")).toContain("403");
    }
  });
});

describe("nome do titular x OpenAPI (RN-MAT-21)", () => {
  it("issue 768, CA7: o PATCH apara, grava, sobe a versão só quando muda; vazio, nulo ou omitido apagam; 161 é recusado no campo", async () => {
    await login("ana@exemplo.com");
    for (const schema of ["OrganizationView", "OrganizationUpdateRequest"]) {
      expect(openapi.components.schemas[schema].properties.holderName).toMatchObject({ nullable: true, maxLength: 160 });
    }
    let version = 0;
    for (const erase of [{ holderName: "" }, { holderName: "   " }, { holderName: null }, {}]) {
      const saved = await (await patch({ name: "Dojo", holderName: "  Dojo Ltda.  " })).json();
      expect(saved).toMatchObject({ holderName: "Dojo Ltda.", holderDocument: null });
      expect(saved.version).toBe(++version);
      expect((await (await patch({ name: "Dojo", holderName: "Dojo Ltda." })).json()).version).toBe(version);
      const cleared = await (await patch({ name: "Dojo", ...erase })).json();
      expect(cleared.holderName).toBeNull();
      expect(cleared.version).toBe(++version);
    }
    expect((await patch({ name: "Dojo", holderName: "x".repeat(160) })).status).toBe(200);
    const refused = await patch({ name: "Dojo", holderName: "x".repeat(161) });
    expect(refused.status).toBe(400);
    expect((await refused.json()).fields.map((f: { field: string }) => f.field)).toContain("holderName");
    expect((await (await get()).json()).holderName).toBe("x".repeat(160));
  });
});

describe("regras e Coordenador x OpenAPI (RF-ORG-01, RN-ORG-13, CA13)", () => {
  const rules = (over: Record<string, unknown> = {}) => ({ deactivationDays: 45, formerStudentRetentionMonths: 24, trialRetentionMonths: 3, crossUnitTraining: "denied", ...over });

  it("a leitura traz rules e coordinator do contrato e o PATCH com rules grava, valida a faixa e, sem rules, mantém", async () => {
    await login("ana@exemplo.com");
    const read = await (await get()).json();
    expect(Object.keys(read.rules).sort()).toEqual(Object.keys(openapi.components.schemas.OrganizationRules.properties).sort());
    expect(Object.keys(read.coordinator).sort()).toEqual(Object.keys(openapi.components.schemas.Coordinator.properties).sort());
    expect(Object.keys(openapi.components.schemas.OrganizationUpdateRequest.properties)).toContain("rules");

    const saved = await patch({ name: "Dojo", rules: rules() });
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({ rules: rules(), version: 1 });
    expect((await (await patch({ name: "Dojo" })).json()).rules).toEqual(rules());
    expect((await (await patch({ name: "Dojo", rules: rules() })).json()).version).toBe(1);

    for (const [over, field] of [
      [{ deactivationDays: 14 }, "rules.deactivationDays"],
      [{ deactivationDays: 91 }, "rules.deactivationDays"],
      [{ formerStudentRetentionMonths: 0 }, "rules.formerStudentRetentionMonths"],
      [{ trialRetentionMonths: 61 }, "rules.trialRetentionMonths"],
      [{ crossUnitTraining: "x" }, "rules.crossUnitTraining"],
    ] as const) {
      const res = await patch({ name: "Dojo", rules: rules(over) });
      expect(res.status).toBe(400);
      expect((await res.json()).fields.map((f: { field: string }) => f.field)).toContain(field);
    }
    expect((await (await get()).json()).rules).toEqual(rules());
  });

  it("o Administrador lê rules e coordinator e não grava regra (403)", async () => {
    await login("varios@exemplo.com", "00000000-0000-0000-0000-000000000011");
    const read = await (await get()).json();
    expect(read.rules.deactivationDays).toBe(30);
    expect(read.coordinator.email).toBeTruthy();
    expect((await patch({ name: "Hack", rules: rules() })).status).toBe(403);
  });
});

describe("comprovante da graduação de origem é por modalidade (RF-MOD-01, RF-MOD-02, RN-GRA-09)", () => {
  it("ligar numa modalidade não muda outra", async () => {
    await login("ana@exemplo.com");
    const items: { id: string; name: string }[] = await (await fetch("/api/v1/modalities")).json();
    const ids = ["Jiu-Jitsu", "Judô"].map((name) => items.find((m) => m.name === name)!.id);
    const url = (id: string) => `/api/v1/modalities/${id}/graduation`;
    for (const id of ids) await fetch(`/api/v1/modalities/${id}/activation`, { method: "PUT", headers: json, body: JSON.stringify({ active: true }) });
    const [bjj, judo] = ids as [string, string];
    const other = await (await fetch(url(judo))).json();
    const saved = await fetch(url(bjj), { method: "PUT", headers: json, body: JSON.stringify({ enabled: false, requireOriginProof: true, levels: [] }) });
    expect(saved.status).toBe(200);
    expect((await (await fetch(url(bjj))).json()).requireOriginProof).toBe(true);
    expect(await (await fetch(url(judo))).json()).toEqual(other);
    expect(other.requireOriginProof).toBe(false);
  });
});

describe("transferência da coordenação x OpenAPI (RF-ORG-06, CA16)", () => {
  const transfer = (body: unknown, token?: string) =>
    fetch("/api/v1/organization/coordination-transfer", {
      method: "POST",
      headers: token ? { ...json, "X-Reauth-Token": token } : json,
      body: JSON.stringify(body),
    });
  const declared = Object.keys(openapi.paths["/organization/coordination-transfer"].post.responses);
  const ok = { email: " Admin@Alfa.test ", confirmation: " transferir " };

  it("sem sessão 401; Administrador 403; Coordenador sem token 403 REAUTH_REQUIRED; campos errados 400; sucesso 204 e vira Administrador", async () => {
    expect((await transfer(ok, "t")).status).toBe(401);
    await login("varios@exemplo.com", "00000000-0000-0000-0000-000000000011");
    expect((await transfer(ok, "t")).status).toBe(403);

    await login("ana@exemplo.com");
    const noToken = await transfer(ok);
    expect(noToken.status).toBe(403);
    expect((await noToken.json()).code).toBe("REAUTH_REQUIRED");
    for (const [body, field] of [
      [{ ...ok, confirmation: "" }, "confirmation"],
      [{ ...ok, email: "outro@x.com" }, "email"],
    ] as const) {
      const res = await transfer(body, "t");
      expect(res.status).toBe(400);
      expect((await res.json()).fields.map((f: { field: string }) => f.field)).toContain(field);
    }
    const done = await transfer({ ...ok, keepUnitIds: [CENTRO] }, "t");
    expect(done.status).toBe(204);
    for (const status of [204, 400, 401, 403, 409]) expect(declared).toContain(String(status));
    expect((await transfer(ok, "t")).status).toBe(403);
    expect((await (await fetch("/api/v1/auth/session")).json()).links[0].role).toBe("ADMINISTRATOR");
  });

  it("keepUnitIds: unidade inexistente ou repetida 400; Administrador único da unidade não marcada 409; sem unidades a sessão acaba", async () => {
    await login("ana@exemplo.com");
    for (const keepUnitIds of [["x"], [CENTRO, CENTRO]]) {
      const res = await transfer({ ...ok, keepUnitIds }, "t");
      expect(res.status).toBe(400);
      expect((await res.json()).fields.map((f: { field: string }) => f.field)).toContain("keepUnitIds");
    }
    const bruno = { email: "bruno@alfa.test", confirmation: "TRANSFERIR" };
    const refused = await transfer(bruno, "t");
    expect(refused.status).toBe(409);
    expect((await refused.json()).code).toBe("LAST_UNIT_ADMINISTRATOR");
    expect((await transfer({ ...bruno, keepUnitIds: [CENTRO] }, "t")).status).toBe(204);
  });

  it("sem unidades marcadas a transferência encerra a sessão (401 na seguinte)", async () => {
    await login("ana@exemplo.com");
    expect((await transfer(ok, "t")).status).toBe(204);
    expect((await fetch("/api/v1/auth/session")).status).toBe(401);
  });

  it("valor da vaga: só o Coordenador (200 com 5000); Administrador 403; sem sessão 401", async () => {
    const price = () => fetch("/api/v1/organization/admin-seat-price");
    expect((await price()).status).toBe(401);
    await login("varios@exemplo.com", "00000000-0000-0000-0000-000000000011");
    expect((await price()).status).toBe(403);
    await login("ana@exemplo.com");
    const res = await price();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ adminSeatCents: 5000 });
  });
});

describe("última alteração e versão x OpenAPI (RF-ORG-08, RNF-15)", () => {
  it("lastChange nulo no início; gravação que muda valor sobe a versão e preenche ator e instante; sem mudança nada muda", async () => {
    await login("ana@exemplo.com");
    const first = await (await get()).json();
    expect(first).toMatchObject({ version: 0, lastChange: null });
    const saved = await (await patch({ name: "Novo nome" })).json();
    expect(saved.version).toBe(1);
    expect(saved.lastChange).toEqual({ at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), by: "Ana" });
    const same = await (await patch({ name: "Novo nome" })).json();
    expect(same).toEqual(saved);
    expect(Object.keys(openapi.components.schemas.LastChange.properties).sort()).toEqual(["at", "by"]);
  });

  it("versão antiga responde 409 EDIT_CONFLICT; sem If-Match ou inválido, 428 PRECONDITION_REQUIRED; nada é gravado", async () => {
    await login("ana@exemplo.com");
    await patch({ name: "Primeiro" });
    const stale = await patch({ name: "Segundo" }, "0");
    expect(stale.status).toBe(409);
    expect((await stale.json()).code).toBe("EDIT_CONFLICT");
    for (const header of [null, "abc", ""]) {
      const res = await patch({ name: "Segundo" }, header);
      expect(res.status).toBe(428);
      expect((await res.json()).code).toBe("PRECONDITION_REQUIRED");
    }
    expect((await (await get()).json()).name).toBe("Primeiro");
    expect(Object.keys(openapi.paths["/organization"].patch.responses)).toEqual(expect.arrayContaining(["409", "428"]));
    expect(openapi.paths["/organization"].patch.parameters.map((p: { name: string }) => p.name)).toContain("If-Match");
  });
});
