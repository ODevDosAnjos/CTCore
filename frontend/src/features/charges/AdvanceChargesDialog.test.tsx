import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { enrollmentOf, modalityRow } from "@/features/students/enrollmentFixtures";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { gate } from "@/test/gate";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AdvanceChargesDialog } from "./AdvanceChargesDialog";

const onDone = vi.fn();
const onClose = vi.fn();
const made = (ref: string) => ({ id: ref, modalityRowId: "m1", type: "MONTHLY", unitId: "u1", referenceMonth: ref, dueOn: `${ref.slice(0, 8)}05`, toleranceDays: 0, amountCents: 20000 });

let sent: { path: string; body: unknown }[];

function setup(post?: () => Response) {
  sent = [];
  asked.length = 0;
  onDone.mockClear();
  onClose.mockClear();
  server.use(
    http.get("/api/v1/students", () => HttpResponse.json({ items: [{ id: "s1", name: "Maria Lima" }, { id: "s2", name: "Beto Lima" }], page: 1, size: 25, total: 2 })),
    http.get("/api/v1/students/s1/enrollment", () =>
      HttpResponse.json(enrollmentOf([modalityRow(), modalityRow({ id: "m2", modality: { id: "mod2", name: "Judô" } }), modalityRow({ id: "m3", status: "ENDED", modality: { id: "mod3", name: "Muay Thai" } })])),
    ),
    http.get("/api/v1/students/s2/enrollment", () => HttpResponse.json(enrollmentOf([modalityRow({ status: "ENDED" })]))),
    http.get("/api/v1/students/:id/modalities/:row/charges/advance/preview", ({ request }) => {
      const count = new URL(request.url).searchParams.get("count")!;
      asked.push(count);
      return HttpResponse.json(preview(Number(count)));
    }),
    http.post("/api/v1/students/:id/modalities/:row/charges/advance", async ({ request, params }) => {
      sent.push({ path: `${params.id}/${params.row}`, body: await request.json() });
      return post ? post() : HttpResponse.json([made("2026-12-01"), made("2027-01-01"), made("2027-02-01")], { status: 201 });
    }),
  );
  return render(
    <ThemeProvider>
      <AdvanceChargesDialog onClose={onClose} onDone={onDone} />
    </ThemeProvider>,
  );
}

const search = async (user: ReturnType<typeof userEvent.setup>, student = "s1") => {
  await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "li");
  await user.click(await screen.findByRole("button", { name: student === "s1" ? "Maria Lima" : "Beto Lima" }));
};
const preview = (count: number) => ({
  items: Array.from({ length: count }, (_, i) => ({ referenceMonth: `${[ "2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01", "2027-03-01", "2027-04-01" ][i]}`, dueOn: [ "2026-11-05", "2026-12-05", "2027-01-05", "2027-02-05", "2027-03-05", "2027-04-05" ][i], amountCents: 22000 })),
  totalCents: 22000 * count,
});
const asked: string[] = [];

describe("janela Gerar próximas mensalidades (RN-COB-06, CA13, CA14, CA15)", () => {
  it("CA13: lista só as modalidades ativas com o plano, mostra a prévia do servidor, envia N, mostra o resultado, recarrega e fecha ao confirmar", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText("Para quem quer pagar adiantado. A geração automática pula os meses que já existirem.")).toBeInTheDocument();
    await search(user);
    const select = await screen.findByLabelText("Modalidade");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(expect.arrayContaining(["Jiu-Jitsu · Plano Mensal", "Judô · Plano Mensal"]));
    expect(screen.queryByRole("option", { name: "Muay Thai · Plano Mensal" })).not.toBeInTheDocument();
    await user.selectOptions(select, "m1");
    await user.click(screen.getByRole("radio", { name: "3" }));
    const table = within(await screen.findByRole("table", { name: "Prévia das mensalidades" }));
    expect(table.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell").map((c) => c.textContent))).toEqual([
      ["nov/2026", "05/11/2026", "R$ 220,00"],
      ["dez/2026", "05/12/2026", "R$ 220,00"],
      ["jan/2027", "05/01/2027", "R$ 220,00"],
      ["Total", "R$ 660,00"],
    ]);
    expect(screen.getByText("Se o plano for reajustado depois, as cobranças pagas não mudam.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gerar 3 mensalidades" }));
    expect(await screen.findByText("3 mensalidades criadas (de dez/2026 a fev/2027).")).toBeInTheDocument();
    expect(sent).toEqual([{ path: "s1/m1", body: { count: 3 } }]);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("CA14: sem aluno ou modalidade o botão fica desabilitado e a prévia não é pedida; o singular vem com 1 mês", async () => {
    const user = userEvent.setup();
    setup();
    const submit = screen.getByRole("button", { name: "Gerar 3 mensalidades" });
    expect(submit).toBeDisabled();
    await search(user);
    await screen.findByLabelText("Modalidade");
    expect(submit).toBeDisabled();
    expect(asked).toEqual([]);
    await user.click(screen.getByRole("radio", { name: "1" }));
    expect(screen.getByRole("button", { name: "Gerar 1 mensalidade" })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Modalidade"), "m1");
    await waitFor(() => expect(asked).toEqual(["1"]));
    expect(screen.getByRole("button", { name: "Gerar 1 mensalidade" })).toBeEnabled();
    expect(screen.getAllByRole("radio").map((r) => r.closest("label")?.textContent)).toEqual(["1", "2", "3", "6"]);
  });

  it("CA13: erro do servidor mostra a mensagem no alto, nada é gerado e a janela continua aberta", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json({ code: "UNPROCESSABLE" }, { status: 422 }));
    await search(user);
    await user.selectOptions(await screen.findByLabelText("Modalidade"), "m1");
    await screen.findByRole("table", { name: "Prévia das mensalidades" });
    await user.click(screen.getByRole("button", { name: "Gerar 3 mensalidades" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("bolsa de 100%");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("CA13/CA16: estados: carregando, aluno sem modalidade ativa, erro com nova tentativa e sem permissão", async () => {
    const user = userEvent.setup();
    setup();
    const students = gate();
    server.use(http.get("/api/v1/students", async () => (await students.opened, HttpResponse.json({ items: [{ id: "s1", name: "Maria Lima" }, { id: "s2", name: "Beto Lima" }], page: 1, size: 25, total: 2 }))));
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "li");
    expect(await screen.findByText("Carregando...")).toBeInTheDocument();
    students.release();
    await user.click(await screen.findByRole("button", { name: "Beto Lima" }));
    expect(await screen.findByText("Sem modalidade ativa")).toBeInTheDocument();
    server.use(http.get("/api/v1/students/s1/enrollment", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    await user.click(screen.getByRole("button", { name: /Trocar/ }));
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "li");
    await user.click(await screen.findByRole("button", { name: "Maria Lima" }));
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Trocar/ }));
    server.use(http.get("/api/v1/students", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 })));
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "zz");
    await waitFor(() => expect(screen.getByText("Você não tem acesso")).toBeInTheDocument());
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA18: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup();
    await search(user);
    await user.selectOptions(await screen.findByLabelText("Modalidade"), "m1");
    await screen.findByRole("table", { name: "Prévia das mensalidades" });
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it("Esc fecha a janela do resultado", async () => {
    const user = userEvent.setup();
    setup();
    await search(user);
    await user.selectOptions(await screen.findByLabelText("Modalidade"), "m1");
    await user.click(screen.getByRole("button", { name: "Gerar 3 mensalidades" }));
    await screen.findByText("3 mensalidades criadas (de dez/2026 a fev/2027).");
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
