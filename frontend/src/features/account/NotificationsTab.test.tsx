import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { NotificationsTab } from "./NotificationsTab";

let puts: unknown[];

function setup(role: "COORDINATOR" | "ADMINISTRATOR", over: Parameters<typeof server.use>[number][] = []) {
  puts = [];
  let receiveAll = false;
  server.use(
    ...over,
    http.get("/api/v1/notifications/preferences", () => HttpResponse.json({ receiveAll, canReceiveAll: role === "COORDINATOR" })),
    http.put("/api/v1/notifications/preferences", async ({ request }) => {
      const body = (await request.json()) as { receiveAll: boolean };
      puts.push(body);
      receiveAll = body.receiveAll;
      return HttpResponse.json({ receiveAll, canReceiveAll: true });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SessionProvider>
          <NotificationsTab />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const save = () => screen.getByRole("button", { name: "Salvar alterações" });
const discard = () => screen.getByRole("button", { name: "Descartar" });

describe("NotificationsTab (CA10)", () => {
  it("o Coordenador liga Receber tudo, salva com o PUT e o botão volta a desabilitado; Descartar desfaz", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    const toggle = await screen.findByRole("switch", { name: "Receber tudo" });
    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    await user.click(discard());
    expect(toggle).not.toBeChecked();
    expect(save()).toBeDisabled();
    expect(puts).toEqual([]);

    await user.click(toggle);
    await user.click(save());
    await waitFor(() => expect(puts).toEqual([{ receiveAll: true }]));
    await waitFor(() => expect(save()).toBeDisabled());
    expect(toggle).toBeChecked();
  });

  it("o Administrador vê Receber tudo desabilitado com o motivo; nenhum PUT; os itens futuros ficam Em breve", async () => {
    setup("ADMINISTRATOR");
    const toggle = await screen.findByRole("switch", { name: "Receber tudo" });
    expect(toggle).toBeDisabled();
    expect(screen.getByText("Só o Coordenador muda. Recebe também o que é das unidades.")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Notificações da minha unidade" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Receber o “Precisa de atenção” todo dia às 7h" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("switch", { name: "Dicas dos primeiros dias" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Em breve")).toHaveLength(2);
    expect(screen.getByText("Sempre enviamos: avisos de segurança da conta e da assinatura")).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(4);
    expect(puts).toEqual([]);
  });

  it("falha ao salvar mostra o aviso e mantém a mudança", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", [http.put("/api/v1/notifications/preferences", () => new HttpResponse(null, { status: 500 }))]);
    const toggle = await screen.findByRole("switch", { name: "Receber tudo" });
    await user.click(toggle);
    await user.click(save());
    expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument();
    expect(toggle).toBeChecked();
    expect(save()).toBeEnabled();
  });

  it("carregando, erro com Tentar de novo e sem permissão (403)", async () => {
    const user = userEvent.setup();
    let fail = true;
    const first = setup("COORDINATOR", [http.get("/api/v1/notifications/preferences", () => (fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ receiveAll: false, canReceiveAll: true })))]);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByRole("switch", { name: "Receber tudo" })).toBeInTheDocument();
    first.unmount();

    setup("COORDINATOR", [http.get("/api/v1/notifications/preferences", () => new HttpResponse(null, { status: 403 }))]);
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("axe a 360 px no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR");
    await screen.findByRole("switch", { name: "Receber tudo" });
    expect(await axeViolations(container)).toEqual([]);
  });
});
