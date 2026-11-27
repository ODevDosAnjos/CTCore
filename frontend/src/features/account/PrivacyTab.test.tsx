import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { PrivacyTab } from "./PrivacyTab";

const URL_EXPORT = "/api/v1/auth/data-export";

async function setup(portal = false) {
  await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@b.c", password: "x" }) });
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SessionProvider>
          <PrivacyTab portal={portal} />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
const button = () => screen.getByRole("button", { name: "Baixar meus dados" });

// issue 764, CA10 e CA11
describe("PrivacyTab: Baixar meus dados", () => {
  const saved: { name: string; blob: Blob }[] = [];
  let blob: Blob;
  beforeEach(() => {
    saved.length = 0;
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => ((blob = b as Blob), "blob:x"));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      saved.push({ name: this.download, blob });
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fica desabilitado enquanto prepara e salva o arquivo com o conteúdo da resposta", async () => {
    let release = () => {};
    const gate = new Promise<void>((r) => (release = r));
    server.use(http.get(URL_EXPORT, async () => {
      await gate;
      return HttpResponse.json({ account: { email: "ana@exemplo.com" } });
    }));
    await setup();
    await userEvent.setup().click(button());
    expect(screen.getByRole("button", { name: "Preparando o arquivo..." })).toBeDisabled();
    release();
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0].name).toBe("meus-dados-ctcore.json");
    expect(saved[0].blob.type).toBe("application/json");
    expect(JSON.parse(await saved[0].blob.text())).toEqual({ account: { email: "ana@exemplo.com" } });
    await waitFor(() => expect(button()).toBeEnabled());
  });

  it("falha mostra o erro com Tentar de novo, que baixa", async () => {
    const user = userEvent.setup();
    server.use(http.get(URL_EXPORT, () => new HttpResponse(null, { status: 500 }), { once: true }));
    await setup();
    await user.click(button());
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(saved).toHaveLength(1));
  });

  it("403 mostra sem permissão", async () => {
    server.use(http.get(URL_EXPORT, () => new HttpResponse(null, { status: 403 })));
    await setup();
    await userEvent.setup().click(button());
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    expect(saved).toEqual([]);
  });

  it("401 relê a sessão", async () => {
    const reads = vi.fn();
    server.use(
      http.get(URL_EXPORT, () => new HttpResponse(null, { status: 401 })),
      http.get("/api/v1/auth/session", () => {
        reads();
        return new HttpResponse(null, { status: 401 });
      }),
    );
    await setup();
    await waitFor(() => expect(reads).toHaveBeenCalledTimes(1));
    await userEvent.setup().click(button());
    await waitFor(() => expect(reads).toHaveBeenCalledTimes(2));
  });

  it.each([false, true])("no portal os dois seguem Em breve e não chamam rota (abaixo de 640 px: %s)", async (narrow) => {
    setDeviceNarrow(narrow);
    const calls = vi.fn();
    server.use(http.get(URL_EXPORT, () => {
      calls();
      return HttpResponse.json({});
    }));
    await setup(true);
    expect(screen.getAllByText("Em breve")).toHaveLength(2);
    for (const item of screen.getAllByRole(narrow ? "link" : "button")) {
      expect(item).toHaveAttribute("aria-disabled", "true");
      await userEvent.setup().click(item);
    }
    expect(calls).not.toHaveBeenCalled();
  });

  it.each([false, true])("sem violações no axe a 360 px, com o botão e com o erro (escuro: %s)", async (dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    server.use(http.get(URL_EXPORT, () => new HttpResponse(null, { status: 500 })));
    const { container } = await setup();
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.setup().click(button());
    await screen.findByRole("button", { name: "Tentar de novo" });
    expect(await axeViolations(container)).toEqual([]);
  });
});
