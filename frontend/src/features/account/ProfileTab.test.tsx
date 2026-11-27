import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { portalShellOk } from "@/test/portalShell";
import { ThemeProvider } from "@/theme/ThemeProvider";

// O corte real precisa de canvas; aqui só importa o que a aba faz com o arquivo cortado.
vi.mock("@/features/organization/LogoCropDialog", () => ({
  LogoCropDialog: ({ onConfirm, labels }: { onConfirm: (b: Blob) => Promise<void>; labels: { title: string } }) => (
    <button type="button" onClick={() => void onConfirm(new Blob(["png ficticio"], { type: "image/png" }))}>
      {labels.title}
    </button>
  ),
}));

// FormData e File do jsdom não passam pelo fetch do Node: só o corpo do envio vira texto; o resto usa o MSW.
beforeEach(() => {
  const send = globalThis.fetch;
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => send(input, init?.body instanceof FormData ? { ...init, body: 'name="file"' } : init));
});
afterEach(() => vi.restoreAllMocks());

// Usa as rotas simuladas do MSW (sessão e perfil), com o login do mock.
async function open(email = "a@b.c") {
  await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "x" }) });
  server.use(portalShellOk);
  const view = render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/conta?aba=perfil"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
  await screen.findByRole("heading", { name: "Meus vínculos" });
  return view;
}

const header = () => screen.getAllByRole("banner")[0];
const card = (name: string) => within(screen.getByRole("region", { name }));
const png = () => new File(["x"], "foto.png", { type: "image/png" });

describe("ProfileTab (#763 CA6, CA7)", () => {
  it("mostra os dados preenchidos acima de Meus vínculos; salva, avisa e atualiza o topo", async () => {
    const user = userEvent.setup();
    await open();
    expect(within(screen.getByRole("tabpanel")).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Foto", "Seus dados", "Meus vínculos"]);
    const name = screen.getByRole("textbox", { name: /^Nome/ });
    expect(name).toHaveValue("Ana");
    expect(screen.getByRole("textbox", { name: "Telefone/WhatsApp" })).toHaveValue("");
    await user.clear(name);
    await user.type(name, "Ana Fictícia");
    await user.type(screen.getByRole("textbox", { name: "Telefone/WhatsApp" }), "21999990000");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Dados salvos.")).toBeInTheDocument();
    expect(within(header()).getByText("Ana Fictícia")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Telefone/WhatsApp" })).toHaveValue("(21) 99999-0000");
  });

  it("422 aparece no campo do nome ou no aviso do telefone sem perder o digitado", async () => {
    const user = userEvent.setup();
    await open();
    const name = screen.getByRole("textbox", { name: /^Nome/ });
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(name).toHaveAccessibleDescription("Informe o nome, com até 120 caracteres."));
    await user.type(name, "Ana");
    await user.type(screen.getByRole("textbox", { name: "Telefone/WhatsApp" }), "123");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await card("Seus dados").findByText(/Confira o telefone/, { selector: "[role=alert] div" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Telefone/WhatsApp" })).toHaveValue("(12) 3");
  });

  it.each([
    [403, "Você não tem permissão para alterar o perfil."],
    [500, "Não foi possível salvar. Tente de novo."],
  ])("resposta %s mostra aviso", async (status, text) => {
    const user = userEvent.setup();
    await open();
    server.use(http.put("/api/v1/auth/profile", () => new HttpResponse(null, { status })));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("envia a foto, mostra no topo, troca o rótulo e remove, voltando as iniciais", async () => {
    const user = userEvent.setup();
    await open();
    expect(header().querySelector("img[src^='data:']")).toBeNull();
    expect(screen.queryByRole("button", { name: "Remover foto" })).not.toBeInTheDocument();
    await user.upload(screen.getByLabelText("Arquivo da foto"), png());
    await user.click(screen.getByRole("button", { name: "Cortar a foto" }));
    expect(await screen.findByText("Foto salva.")).toBeInTheDocument();
    expect(header().querySelector("img[src^='data:']")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Trocar foto" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover foto" }));
    expect(await screen.findByText("Foto removida.")).toBeInTheDocument();
    expect(header().querySelector("img[src^='data:']")).toBeNull();
    expect(screen.getByRole("button", { name: "Enviar foto" })).toBeInTheDocument();
  });

  it("durante o envio os botões ficam desabilitados; 422 do arquivo vira aviso", async () => {
    const user = userEvent.setup();
    await open();
    let release = () => {};
    const gate = new Promise<void>((r) => (release = r));
    server.use(
      http.put("/api/v1/auth/profile/photo", async () => {
        await gate;
        return HttpResponse.json({ code: "UNPROCESSABLE", fields: [{ field: "file", message: "x" }] }, { status: 422 });
      }),
    );
    await user.upload(screen.getByLabelText("Arquivo da foto"), png());
    await user.click(screen.getByRole("button", { name: "Cortar a foto" }));
    expect(screen.getByRole("button", { name: "Enviar foto" })).toBeDisabled();
    release();
    expect(await screen.findByText(/A foto não foi aceita/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar foto" })).toBeEnabled();
  });

  it.each([
    [new File(["x"], "foto.gif", { type: "image/gif" }), "Use uma imagem PNG, JPG ou WebP."],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "foto.png", { type: "image/png" }), "A foto precisa ter até 5 MB."],
  ])("arquivo recusado antes do corte (%#)", async (file, text) => {
    await open();
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText("Arquivo da foto"), file);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cortar a foto" })).not.toBeInTheDocument();
  });

  it("no portal o Perfil é só Meus vínculos", async () => {
    await open("aluno@exemplo.com");
    expect(within(screen.getByRole("tabpanel")).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Meus vínculos"]);
    expect(screen.queryByLabelText("Arquivo da foto")).not.toBeInTheDocument();
  });

  it.each([false, true])("sem violações no axe (escuro: %s)", async (dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = await open();
    expect(document.documentElement.classList.contains("dark")).toBe(dark);
    expect(await axeViolations(container)).toEqual([]);
  });
});
