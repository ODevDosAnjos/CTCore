import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { UnitModalitiesSection } from "./UnitModalitiesSection";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const item = (id: string, name: string, offered: boolean, graduationEnabled = true) => ({ id, name, offered, classCount: 0, planCount: 0, graduationEnabled });

const ui = (unitId: string, unitName = "Tijuca") => (
  <ThemeProvider>
    <MemoryRouter>
      <UnitModalitiesSection unitId={unitId} unitName={unitName} />
    </MemoryRouter>
  </ThemeProvider>
);
const listing = (unit: Record<string, unknown>, canManage = true) =>
  http.get("/api/v1/units/:id/modalities", ({ params }) => HttpResponse.json({ canManage, items: unit[String(params.id)] ?? [] }));
const refusal = (fields: { field: string; message: string }[]) =>
  http.put("/api/v1/units/:id/modalities/:mid", () => HttpResponse.json({ code: "UNIT_MODALITY_IN_USE", message: "x", changed: false, fields }, { status: 409 }));

describe("UnitModalitiesSection (RF-MOD-03)", () => {
  it("CA8: título com a unidade, caixa de marcar com nome e 'Graduação ligada'; marca e desmarca na hora", async () => {
    const user = userEvent.setup();
    const puts: unknown[] = [];
    server.use(
      listing({ [A]: [item("m1", "Boxe", false, false), item("m2", "Judô", true)] }),
      http.put("/api/v1/units/:id/modalities/:mid", async ({ request, params }) => {
        puts.push([params.id, params.mid, await request.json()]);
        return HttpResponse.json(item(String(params.mid), "x", true));
      }),
    );
    render(ui(A));
    expect(await screen.findByRole("heading", { name: "Modalidades oferecidas na Tijuca" })).toBeInTheDocument();
    const boxe = await screen.findByRole("checkbox", { name: "Boxe" });
    expect(boxe).not.toBeChecked();
    expect(boxe).toHaveAccessibleDescription("Graduação desligada");
    expect(screen.getByRole("checkbox", { name: "Judô" })).toHaveAccessibleDescription("Graduação ligada");
    expect(screen.queryByRole("switch")).toBeNull();
    await user.click(boxe);
    expect(screen.getByRole("checkbox", { name: "Boxe" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Judô" }));
    expect(screen.getByRole("checkbox", { name: "Judô" })).not.toBeChecked();
    expect(puts).toEqual([[A, "m1", { offered: true }], [A, "m2", { offered: false }]]);
  });

  it("CA8: erro do servidor volta a caixa ao valor anterior e mostra a mensagem", async () => {
    const user = userEvent.setup();
    server.use(listing({ [A]: [item("m1", "Boxe", false)] }), http.put("/api/v1/units/:id/modalities/:mid", () => HttpResponse.json({ code: "BOOM" }, { status: 500 })));
    render(ui(A));
    await user.click(await screen.findByRole("checkbox", { name: "Boxe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível alterar Boxe. Nada foi alterado. Tente de novo.");
    expect(screen.getByRole("checkbox", { name: "Boxe" })).not.toBeChecked();
  });

  it("CA9: turma ativa impede desmarcar; a caixa volta e o aviso mostra a turma com os alunos e a orientação", async () => {
    const user = userEvent.setup();
    server.use(
      listing({ [A]: [item("m1", "Muay Thai", true)] }),
      refusal([{ field: "class", message: "Muay Thai Adulto · Noite" }, { field: "classStudents", message: "26" }]),
    );
    render(ui(A));
    await user.click(await screen.findByRole("checkbox", { name: "Muay Thai" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Muay Thai não pode sair da Tijuca");
    expect(alert).toHaveTextContent("Turma ativa: Muay Thai Adulto · Noite (26 alunos)");
    expect(alert).toHaveTextContent("Desative a turma em Operação › Turmas e tente de novo.");
    expect(screen.getByRole("checkbox", { name: "Muay Thai" })).toBeChecked();
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it("CA9: singular com 1 aluno, '0 alunos' sem alunos e uma linha por turma", async () => {
    const user = userEvent.setup();
    server.use(
      listing({ [A]: [item("m1", "Judô", true)] }),
      refusal([
        { field: "class", message: "Judô Adulto" },
        { field: "classStudents", message: "1" },
        { field: "class", message: "Judô Kids" },
        { field: "classStudents", message: "0" },
      ]),
    );
    render(ui(A));
    await user.click(await screen.findByRole("checkbox", { name: "Judô" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Turma ativa: Judô Adulto (1 aluno)");
    expect(alert).toHaveTextContent("Turma ativa: Judô Kids (0 alunos)");
  });

  it("CA8: sem canManage a caixa é só leitura", async () => {
    server.use(listing({ [A]: [item("m1", "Boxe", true)] }, false));
    render(ui(A));
    const boxe = await screen.findByRole("checkbox", { name: "Boxe" });
    expect(boxe).toBeDisabled();
    expect(boxe).toBeChecked();
  });

  it("CA8: trocar a unidade mostra as marcações da unidade escolhida", async () => {
    server.use(listing({ [A]: [item("m1", "Boxe", true)], [B]: [item("m1", "Boxe", false)] }));
    const { rerender } = render(ui(A));
    expect(await screen.findByRole("checkbox", { name: "Boxe" })).toBeChecked();
    rerender(ui(B));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Boxe" })).not.toBeChecked());
  });

  it("CA12: vazio orienta a ativar modalidades, com link; erro tem 'Tentar de novo'; 403 mostra sem permissão; carregando", async () => {
    const user = userEvent.setup();
    server.use(listing({}));
    const first = render(ui(A));
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(await screen.findByText("Nenhuma modalidade ativa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para Configurações › Modalidades" })).toHaveAttribute("href", "/configuracoes/organizacao?aba=modalidades");
    first.unmount();

    let fail = true;
    server.use(http.get("/api/v1/units/:id/modalities", () => (fail ? HttpResponse.error() : HttpResponse.json({ canManage: true, items: [item("m1", "Boxe", false)] }))));
    render(ui(A));
    fail = true;
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    fail = false;
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("checkbox", { name: "Boxe" })).toBeInTheDocument();

    server.use(http.get("/api/v1/units/:id/modalities", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 })));
    render(ui(B));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA12: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    server.use(listing({ [A]: [item("m1", "Boxe", false), item("m2", "Judô", true)] }));
    const { container } = render(ui(A));
    await screen.findByRole("checkbox", { name: "Boxe" });
    expect(await axeViolations(container)).toEqual([]);
  });
});
