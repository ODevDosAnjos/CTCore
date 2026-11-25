import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const openapi = parse(readFileSync(join(process.cwd(), "../docs/openapi.yaml"), "utf8"));
const json = { "Content-Type": "application/json" };
const CENTRO = "00000000-0000-0000-0000-000000000021";
const BRUNO = "00000000-0000-0000-0000-000000000041";
const CARLA = "00000000-0000-0000-0000-000000000042";
const ADMIN_LINK = "00000000-0000-0000-0000-000000000011";

const login = async (email: string, linkId?: string) => {
  await fetch("/api/v1/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password: "segredo123" }) });
  if (linkId) await fetch("/api/v1/auth/session/link", { method: "PUT", headers: json, body: JSON.stringify({ linkId }) });
};
const send = (method: string, path: string, body?: unknown) =>
  fetch(`/api/v1/users${path}`, { method, headers: json, body: body === undefined ? undefined : JSON.stringify(body) });
const declared = (path: string, method: string) => Object.keys(openapi.paths[path][method].responses);

describe("equipe da gestão x OpenAPI (CA22)", () => {
  it("sem sessão responde 401 e a lista do Coordenador traz exatamente as chaves do contrato", async () => {
    expect((await send("GET", "")).status).toBe(401);
    await login("ana@exemplo.com");
    const required: string[] = openapi.components.schemas.StaffUser.required;
    const rows = await (await send("GET", "")).json();
    expect(rows.map((r: { name: string }) => r.name)).toEqual(["Bruno", "Carla"]);
    for (const row of rows) expect(Object.keys(row).sort()).toEqual([...required].sort());
    expect(Object.keys(openapi.components.schemas.StaffUser.properties).sort()).toEqual([...required].sort());
    expect((await send("GET", "?status=ENDED").then((r) => r.json())).length).toBe(0);
    expect((await send("GET", "?status=XYZ")).status).toBe(400);
  });
  it("R1/CA1 (#611): o Administrador recebe 403 em todas as rotas e nada muda", async () => {
    await login("varios@exemplo.com", ADMIN_LINK);
    expect((await send("GET", "")).status).toBe(403);
    expect((await send("POST", "", { email: "novo@alfa.test", name: "Novo", unitIds: [CENTRO] })).status).toBe(403);
    expect((await send("POST", `/${CARLA}/resend`)).status).toBe(403);
    expect((await send("PUT", `/${BRUNO}/units`, { unitIds: [CENTRO] })).status).toBe(403);
    expect((await send("DELETE", `/${BRUNO}`)).status).toBe(403);
    expect((await send("POST", "/coordinator-appointment", { unitIds: [CENTRO] })).status).toBe(403);
  });

  it("R2/CA3 (#611): seats é uma vaga por unidade do vínculo ativo; 0 no pendente e no Coordenador nomeado", async () => {
    await login("ana@exemplo.com");
    const seats = async () => Object.fromEntries((await (await send("GET", "")).json()).map((r: { name: string; seats: number }) => [r.name, r.seats]));
    expect(await seats()).toEqual({ Bruno: 1, Carla: 0 });
    const own = await (await send("POST", "/coordinator-appointment", { unitIds: [CENTRO] })).json();
    expect(own.seats).toBe(0);
    expect(await seats()).toEqual({ Bruno: 1, Carla: 0, [own.name]: 0 });
    const invited = await (await send("POST", "", { email: "dois@alfa.test", name: "Dois", unitIds: [CENTRO] })).json();
    expect(invited.seats).toBe(0);
  });


  it("convidar: 201 PENDING com perfil implícito; e-mail ligado 409, corpo inválido 400", async () => {
    await login("ana@exemplo.com");
    const ok = await send("POST", "", { role: "COORDINATOR", email: "novo@alfa.test", name: "Novo", unitIds: [CENTRO] });
    expect(ok.status).toBe(201);
    expect(await ok.json()).toMatchObject({ status: "PENDING", role: "ADMINISTRATOR", canManage: true });
    const again = await send("POST", "", { email: "existente@exemplo.com", name: "X", unitIds: [CENTRO] });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe("ALREADY_LINKED");
    expect((await send("POST", "", { email: "x", name: "", unitIds: [] })).status).toBe(400);
    for (const status of ["201", "400", "403", "409"]) expect(declared("/users", "post")).toContain(status);
  });

  it("reenviar: 204 e o quarto no dia é 429; vínculo ativo é 404", async () => {
    await login("ana@exemplo.com");
    for (let i = 0; i < 3; i++) expect((await send("POST", `/${CARLA}/resend`)).status).toBe(204);
    expect((await send("POST", `/${CARLA}/resend`)).status).toBe(429);
    expect((await send("POST", `/${BRUNO}/resend`)).status).toBe(404);
    expect(declared("/users/{linkId}/resend", "post")).toEqual(expect.arrayContaining(["204", "404", "429"]));
  });

  it("RN-ORG-07: desativar ou tirar a unidade do último Administrador é 409 até o Coordenador se nomear", async () => {
    await login("ana@exemplo.com");
    const refused = await send("DELETE", `/${BRUNO}`);
    expect(refused.status).toBe(409);
    const body = await refused.json();
    expect(body.code).toBe("LAST_UNIT_ADMINISTRATOR");
    expect(body.fields).toEqual([{ field: "unitIds", message: CENTRO }]);
    expect((await send("PUT", `/${BRUNO}/units`, { unitIds: ["00000000-0000-0000-0000-000000000099"] })).status).toBe(400);
    const appointed = await send("POST", "/coordinator-appointment", { unitIds: [CENTRO] });
    expect(appointed.status).toBe(200);
    expect(await appointed.json()).toMatchObject({ status: "ACTIVE", role: "ADMINISTRATOR" });
    expect((await send("DELETE", `/${BRUNO}`)).status).toBe(204);
    expect((await send("GET", "?status=ENDED").then((r) => r.json())).map((r: { name: string }) => r.name)).toEqual(["Bruno"]);
    expect((await send("POST", "/coordinator-appointment", { unitIds: [] })).status).toBe(400);
    expect(declared("/users/{linkId}", "delete")).toEqual(expect.arrayContaining(["204", "403", "404", "409"]));
  });

  it("trocar unidades: o Coordenador define a lista; vazio é 400; a linha volta com seats", async () => {
    await login("ana@exemplo.com");
    expect((await send("PUT", `/${CARLA}/units`, { unitIds: [] })).status).toBe(400);
    const ok = await send("PUT", `/${CARLA}/units`, { unitIds: [CENTRO] });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ seats: 0, units: expect.any(Array) });
    expect(declared("/users/{linkId}/units", "put")).toEqual(expect.arrayContaining(["200", "400", "403", "404", "409"]));
  });
});
