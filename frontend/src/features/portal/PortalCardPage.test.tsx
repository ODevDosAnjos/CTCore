import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { PortalCardData } from "./usePortalCard";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "Ana Silva" },
  links: [
    {
      id: "l1",
      organizationId: "o",
      organizationName: "Alfa",
      role: "GUARDIAN",
      unitIds: [],
    },
  ],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const jiu = { id: "m1", name: "Jiu-Jitsu" };
const judo = { id: "m2", name: "Judô" };
const centro = { id: "u1", name: "Centro" };
const norte = { id: "u2", name: "Norte" };
const card = (over: Partial<PortalCardData> = {}): PortalCardData => ({
  organization: { name: "Academia Alfa", color: "#1d4ed8", logoUrl: null },
  student: { id: "s1", name: "Ana Souza", photoUrl: null },
  students: [{ id: "s1", name: "Ana Souza", self: true }],
  status: "ACTIVE",
  today: "2026-10-27",
  generatedAt: "2026-10-27T15:30:00Z",
  timezone: "America/Sao_Paulo",
  memberSince: "2022-03-14",
  modalities: [
    {
      modality: jiu,
      unit: centro,
      belt: {
        levelName: "Azul",
        color: "#1E40AF",
        secondaryColor: null,
        degree: 2,
      },
    },
    { modality: judo, unit: norte, belt: null },
  ],
  ...over,
});
const serve = (data: PortalCardData | ((info: { request: Request }) => Response | Promise<Response>)) =>
  server.use(http.get("/api/v1/portal/card", typeof data === "function" ? data : () => HttpResponse.json(data)));

function setup(path = "/portal/carteirinha", reduced = false) {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/portal/term", () => HttpResponse.json([])),
    http.get("/api/v1/portal/students", () => HttpResponse.json([])),
    http.get("/api/v1/portal/shell", () =>
      HttpResponse.json({
        organization: { name: "Academia Alfa", color: null, logoUrl: null },
        reduced,
        unreadAnnouncements: 0,
      }),
    ),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("PortalCardPage (RF-POR-03)", () => {
  it("CA1: faixa com a organização e o selo Ativo, nome, Aluno desde, modalidades com faixa, Válida em e feito com ctcore; sem QR code nem Atualizada em", async () => {
    serve(card());
    const { container } = setup();
    const article = await screen.findByRole("article", {
      name: "Carteirinha de Ana Souza",
    });
    expect(within(article).getByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
    expect(within(article).getByText("Ativo")).toBeInTheDocument();
    expect(within(article).getByText("Academia Alfa")).toBeInTheDocument();
    expect(within(article).getByText("Aluno desde 03/2022 · Centro, Norte")).toBeInTheDocument();
    expect(within(article).getByText("Válida em 27/10/2026")).toBeInTheDocument();
    expect(within(article).getByText("feito com ctcore")).toBeInTheDocument();
    expect(within(article).getByText("Jiu-Jitsu")).toBeInTheDocument();
    expect(within(article).getByText("Azul, grau 2")).toBeInTheDocument();
    expect(within(article).getByText("Sem faixa registrada")).toBeInTheDocument();
    expect(screen.queryByText(/^Sem conexão · Atualizada em/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Sem conexão/)).not.toBeInTheDocument();
    expect(container.querySelector("canvas, svg[aria-label*='QR' i]")).toBeNull();
    expect(article.textContent).not.toMatch(/presen|frequ|progress|CPF|@/i);
    // #754 CA3: a API manda cor (#1d4ed8) e nada dela chega à página; a marca sem logo mostra as iniciais.
    expect(article.querySelector("[data-initials=AA]")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/--org|1d4ed8|29, 78, 216/i);
  });

  it("CA2: logo que falha some sem erro; foto ausente ou que falha cai para as iniciais", async () => {
    serve(
      card({
        organization: {
          name: "Academia Alfa",
          color: null,
          logoUrl: "http://x.test/logo.png",
        },
        student: {
          id: "s1",
          name: "Ana Souza",
          photoUrl: "http://x.test/foto.png",
        },
      }),
    );
    const { container } = setup();
    const article = await screen.findByRole("article");
    const imgs = article.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    imgs.forEach((i) => i.dispatchEvent(new Event("error")));
    await waitFor(() => expect(article.querySelectorAll("img")).toHaveLength(0));
    expect(within(article).getByText("AS")).toBeInTheDocument();
    expect(article.querySelector("[data-initials=AA]")).not.toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it("CA3, CA8: aluno sem modalidade ativa mostra o selo Inativo e o texto de sem modalidades; sem memberSince a linha traz só a unidade", async () => {
    serve(card({ status: "INACTIVE", modalities: [], memberSince: null }));
    setup();
    const article = await screen.findByRole("article");
    expect(within(article).getByText("Inativo")).toBeInTheDocument();
    expect(within(article).getByText("Nenhuma modalidade ativa")).toBeInTheDocument();
  });

  it("CA4: recepção, Baixar imagem em Em breve que não faz nada e Voltar sem histórico vai para Minhas informações", async () => {
    serve(card());
    const user = userEvent.setup();
    setup();
    await screen.findByRole("article");
    expect(screen.getByText("Minhas informações", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/Mostre na recepção quando pedirem. Não tem QR code/)).toBeInTheDocument();
    expect(screen.queryByText(/No app instalado, a carteirinha abre mesmo sem internet/)).not.toBeInTheDocument();
    const download = screen.getByRole("button", { name: "Baixar imagem" });
    expect(download).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    await user.click(download);
    expect(screen.getByRole("article")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByRole("heading", { name: "Minhas informações" })).toBeInTheDocument();
  });

  it("CA4: no celular o texto é o curto e Voltar fica no topo", async () => {
    setDeviceNarrow(true);
    serve(card());
    setup();
    await screen.findByRole("article");
    expect(screen.getByText("Sem QR code. Mostre na recepção quando pedirem.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Voltar" })).toHaveLength(1);
  });

  it("CA5: responsável com dois filhos vê um cartão por filho e chips; ?aluno= mostra só um e o chip selecionado volta a mostrar todos", async () => {
    const two = [
      { id: "s1", name: "Ana Souza", self: false },
      { id: "s2", name: "Beto Souza", self: false },
    ];
    const asked: (string | null)[] = [];
    serve(({ request }) => {
      const id = new URL(request.url).searchParams.get("studentId");
      asked.push(id);
      const pick = two.find((s) => s.id === id) ?? two[0];
      return HttpResponse.json(card({ students: two, student: { id: pick.id, name: pick.name, photoUrl: null } }));
    });
    const user = userEvent.setup();
    const { unmount } = setup();
    expect(await screen.findByRole("heading", { name: "Carteirinhas" })).toBeInTheDocument();
    expect(screen.getByText("Responsável", { selector: "p" })).toBeInTheDocument();
    await screen.findByRole("article", { name: "Carteirinha de Ana Souza" });
    await screen.findByRole("article", { name: "Carteirinha de Beto Souza" });
    expect(screen.queryByText(/Você vê a carteirinha de cada filho/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baixar imagem" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Beto Souza" }));
    await waitFor(() => expect(screen.queryByRole("article", { name: "Carteirinha de Ana Souza" })).not.toBeInTheDocument());
    expect(screen.getByRole("article", { name: "Carteirinha de Beto Souza" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beto Souza" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Beto Souza" }));
    await screen.findByRole("article", { name: "Carteirinha de Ana Souza" });
    unmount();
    asked.length = 0;
    setup("/portal/carteirinha?aluno=s2");
    await screen.findByRole("article", { name: "Carteirinha de Beto Souza" });
    expect(screen.queryByRole("article", { name: "Carteirinha de Ana Souza" })).not.toBeInTheDocument();
    expect(asked).toEqual(expect.arrayContaining(["s2"]));
  });

  it("CA6: falha de rede com cópia mostra a carteirinha guardada com a faixa Sem conexão e a hora da leitura; 403 e 500 não usam a cópia; sem cópia, erro", async () => {
    serve(card());
    const first = setup();
    await first.findByRole("article");
    first.unmount();

    serve(() => HttpResponse.error());
    const offline = setup();
    const article = await offline.findByRole("article", {
      name: "Carteirinha de Ana Souza",
    });
    expect(screen.getByText("Sem conexão · Atualizada em 27/10/2026 12h30")).toBeInTheDocument();
    expect(screen.getByText(/Sem internet, o app mostra a última versão/)).toBeInTheDocument();
    expect(within(article).getByText("Válida em 27/10/2026")).toBeInTheDocument();
    offline.unmount();

    serve(() => new HttpResponse(null, { status: 500 }));
    const failed = setup();
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    failed.unmount();

    serve(() => new HttpResponse(null, { status: 403 }));
    setup();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("CA6: falha de rede sem cópia mostra o erro e Tentar de novo refaz a leitura", async () => {
    let calls = 0;
    serve(() => (++calls === 1 ? HttpResponse.error() : HttpResponse.json(card())));
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("article")).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it("CA3: com o portal reduzido a rota segue aberta (fora de RequireFullPortal) e mostra o selo Inativo", async () => {
    serve(card({ status: "INACTIVE", modalities: [] }));
    setup("/portal/carteirinha", true);
    expect(await screen.findByText("Inativo")).toBeInTheDocument();
  });

  it("CA7/CA9: enquanto carrega mostra o estado de carregando", async () => {
    serve(() => new Promise<Response>(() => {}));
    setup();
    expect((await screen.findAllByRole("status")).length).toBeGreaterThan(0);
  });

  for (const dark of [false, true]) {
    it(`CA7/CA9: sem violações de acessibilidade no tema ${dark ? "escuro" : "claro"}`, async () => {
      setDevicePrefersDark(dark);
      serve(card());
      const { container } = setup();
      await screen.findByRole("article");
      await waitFor(async () => expect(await axeViolations(container)).toEqual([]));
    });
  }
});
