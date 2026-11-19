import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { AnnouncementDetail, AnnouncementItem, PortalAnnouncementsData } from "./usePortalAnnouncements";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "Ana Silva" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "GUARDIAN", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const item = (over: Partial<AnnouncementItem>): AnnouncementItem => ({
  id: "n0",
  title: "Aviso",
  type: "GENERAL",
  sentAt: "2026-10-25T12:00:00Z",
  pinned: false,
  unread: false,
  destination: { kind: "ORGANIZATION", names: [] },
  author: "Coordenação",
  pinnedUntil: null,
  summary: "",
  modality: null,
  unit: null,
  ...over,
});
const data = (over: Partial<PortalAnnouncementsData> = {}): PortalAnnouncementsData => ({
  reduced: false,
  students: [{ id: "s1", name: "Ana Souza", self: true }],
  studentId: "s1",
  filter: "ALL",
  modalityId: null,
  modalities: [{ id: "m1", name: "Jiu-Jitsu", count: 2 }],
  unreadCount: 2,
  allCount: 3,
  items: [
    item({ id: "n1", title: "Mudança de <b>horário</b>", pinned: true, unread: true, destination: { kind: "UNIT", names: ["Unidade Centro"] } }),
    item({ id: "n2", title: "Exame de faixa", unread: true, destination: { kind: "CLASSES", names: ["Turma A", "Turma B"] }, author: "Prof. Beto" }),
    item({ id: "n3", title: "Recesso", sentAt: "2026-10-20T12:00:00Z" }),
  ],
  page: 1,
  size: 20,
  total: 3,
  ...over,
});
const detail = (over: Partial<AnnouncementDetail> = {}): AnnouncementDetail => ({ ...item({ id: "n1", title: "Mudança de <b>horário</b>" }), body: "Linha um\nLinha <i>dois</i>", imageUrl: null, authorRole: null, groupLink: null, timeZone: "America/Sao_Paulo", ...over });
const serve = (view: PortalAnnouncementsData | ((info: { request: Request }) => Response | Promise<Response>)) =>
  server.use(http.get("/api/v1/portal/announcements", typeof view === "function" ? view : () => HttpResponse.json(view)));

function Probe() {
  const l = useLocation();
  return <span data-testid="where" hidden>{l.pathname + l.search}</span>;
}
const where = () => screen.getByTestId("where").textContent;

function setup(path = "/portal/avisos") {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/portal/term", () => HttpResponse.json([])),
    http.get("/api/v1/portal/students", () => HttpResponse.json([])),
    http.get("/api/v1/portal/shell", () => HttpResponse.json({ organization: { name: "Academia Alfa", color: null, logoUrl: null }, reduced: false, unreadAnnouncements: 2 })),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Probe />
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("PortalAnnouncementsPage (RF-POR-06)", () => {
  it("CA3: lista em cartão único, com ponto Não lido, Fixado até, linha de apoio e data curta; lido sem ponto", async () => {
    serve(
      data({
        items: [
          item({ id: "n1", title: "Aula de quinta cancelada", pinned: true, unread: true, pinnedUntil: "2026-10-17", sentAt: "2026-10-06T12:00:00Z", modality: "Muay Thai", destination: { kind: "CLASS", names: ["Muay Thai Adulto"] }, author: "Bianca Torres", summary: "Sem treino" }),
          item({ id: "n2", title: "Recesso", sentAt: "2026-10-20T12:00:00Z", unit: "Tijuca", destination: { kind: "UNIT", names: ["Tijuca"] } }),
        ],
      }),
    );
    setup();
    const list = await screen.findByRole("list", { name: "Lista de avisos" });
    const [first, last] = within(list).getAllByRole("listitem");
    expect(within(first).getByText("Não lido")).toBeInTheDocument();
    expect(within(first).getByText("Fixado até 17/10")).toBeInTheDocument();
    expect(within(first).getByText("Muay Thai · Muay Thai Adulto · Bianca Torres · Sem treino")).toBeInTheDocument();
    expect(within(first).getByText("06/10", { selector: "span.shrink-0" })).toBeInTheDocument();
    expect(within(last).queryByText("Não lido")).not.toBeInTheDocument();
    expect(within(last).getByText("Coordenação · Tijuca".replace("Coordenação · Tijuca", "Tijuca · Coordenação"))).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Enviado em|Para:|Por Coord|presen|frequ|progress|R$/i);
  });

  it("CA1 e CA4: cabeçalho Da academia, dica abaixo da lista e Marcar lidos no celular", async () => {
    serve(data());
    setup();
    await screen.findByRole("list", { name: "Lista de avisos" });
    expect(screen.getByText("Da academia")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avisos" })).toBeInTheDocument();
    expect(screen.getByText("Marcar lidos")).toBeInTheDocument();
    expect(screen.getByText('Abrir um aviso marca como lido. "Marcar todos como lidos" limpa a lista.')).toBeInTheDocument();
  });

  it("aviso aberto (CA5, CA8): clicar abre a página própria com tipo, apoio, data e hora, autor, texto puro e nota; grava a leitura; Voltar mantém o filtro", async () => {
    let opens = 0;
    let reads = 0;
    let shells = 0;
    serve(() => {
      reads += 1;
      return HttpResponse.json(opens ? data({ unreadCount: 1, items: data().items.map((i) => (i.id === "n1" ? { ...i, unread: false } : i)) }) : data());
    });
    server.use(
      http.post("/api/v1/portal/announcements/n1/open", () => {
        opens += 1;
        return HttpResponse.json(
          detail({ type: "CANCELED_CLASS", modality: "Muay Thai", unit: "Tijuca", destination: { kind: "CLASS", names: ["Muay Thai Adulto"] }, author: "Bianca Torres", authorRole: "TEACHER", sentAt: "2026-10-08T13:02:00Z", imageUrl: "https://files.example/aviso.png" }),
        );
      }),
    );
    const user = userEvent.setup();
    setup("/portal/avisos?filtro=nao-lidos");
    server.use(
      http.get("/api/v1/portal/shell", () => {
        shells += 1;
        return HttpResponse.json({ organization: { name: "Academia Alfa", color: null, logoUrl: null }, reduced: false, unreadAnnouncements: 1 });
      }),
    );
    await user.click(await screen.findByRole("button", { name: /Mudança de <b>horário<\/b>/ }));
    expect(await screen.findByRole("heading", { name: "Mudança de <b>horário</b>" })).toBeInTheDocument();
    expect(where()).toBe("/portal/avisos?filtro=nao-lidos&aviso=n1");
    expect(screen.queryByRole("list", { name: "Lista de avisos" })).not.toBeInTheDocument();
    expect(screen.getByText("Aula cancelada")).toBeInTheDocument();
    expect(screen.getByText("Muay Thai · Muay Thai Adulto · Tijuca")).toBeInTheDocument();
    expect(screen.getByText("08/10/2026 às 10h02")).toBeInTheDocument();
    expect(screen.getByText("Bianca Torres, Professor")).toBeInTheDocument();
    expect(screen.getByText("BT")).toBeInTheDocument();
    expect(screen.getByText(/Linha um/)).toHaveTextContent("Linha <i>dois</i>");
    expect(screen.getByRole("img", { name: "Imagem do aviso" })).toHaveAttribute("src", "https://files.example/aviso.png");
    expect(screen.getByText("Ao abrir, o aviso conta como lido para a academia.")).toBeInTheDocument();
    await waitFor(() => expect(reads).toBe(2));
    await waitFor(() => expect(shells).toBeGreaterThan(0));
    expect(opens).toBe(1);

    await user.click(screen.getByRole("button", { name: /Voltar aos avisos/ }));
    expect(await screen.findByRole("list", { name: "Lista de avisos" })).toBeInTheDocument();
    expect(where()).toBe("/portal/avisos?filtro=nao-lidos");
  });

  it("R5: data e hora do aviso aberto usam o fuso da unidade do aviso, não o do navegador", async () => {
    serve(data());
    server.use(http.post("/api/v1/portal/announcements/n1/open", () => HttpResponse.json(detail({ sentAt: "2026-10-08T13:02:00Z", timeZone: "Asia/Tokyo" }))));
    setup("/portal/avisos?aviso=n1");
    expect(await screen.findByText("08/10/2026 às 22h02")).toBeInTheDocument();
  });

  it("CA6: Ver na agenda mantém o aluno; o grupo da turma abre em nova aba só com link; sem link o botão não existe", async () => {
    serve(data());
    server.use(
      http.post("/api/v1/portal/announcements/n1/open", () => HttpResponse.json(detail({ groupLink: "https://chat.example/grupo" }))),
      http.post("/api/v1/portal/announcements/n2/open", () => HttpResponse.json(detail({ id: "n2", title: "Exame de faixa" }))),
    );
    const first = setup("/portal/avisos?aluno=s1&aviso=n1");
    expect(await screen.findByRole("link", { name: "Ver na agenda" })).toHaveAttribute("href", "/portal/agenda?aluno=s1");
    const group = screen.getByRole("link", { name: "Abrir o grupo da turma" });
    expect(group).toHaveAttribute("href", "https://chat.example/grupo");
    expect(group).toHaveAttribute("target", "_blank");
    expect(group).toHaveAttribute("rel", "noopener noreferrer");
    first.unmount();
    setup("/portal/avisos?aluno=s1&aviso=n2");
    await screen.findByRole("link", { name: "Ver na agenda" });
    expect(screen.queryByRole("link", { name: "Abrir o grupo da turma" })).not.toBeInTheDocument();
  });

  it("CA12: ?aviso= abre direto, com o aluno da URL", async () => {
    const asked: string[] = [];
    serve(data());
    server.use(
      http.post("/api/v1/portal/announcements/n2/open", ({ request }) => {
        asked.push(new URL(request.url).search);
        return HttpResponse.json(detail({ id: "n2", title: "Exame de faixa" }));
      }),
    );
    setup("/portal/avisos?aluno=s1&aviso=n2");
    expect(await screen.findByRole("heading", { name: "Exame de faixa" })).toBeInTheDocument();
    expect(asked).toEqual(["?studentId=s1"]);
  });

  it("aviso que deixou de existir mostra o estado indisponível com o botão de voltar", async () => {
    serve(data());
    server.use(http.post("/api/v1/portal/announcements/n9/open", () => new HttpResponse(null, { status: 404 })));
    setup("/portal/avisos?aviso=n9");
    expect(await screen.findByText("Aviso indisponível")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voltar aos avisos/ })).toBeInTheDocument();
  });

  it("aviso aberto: erro com Tentar de novo e sem permissão", async () => {
    serve(data());
    let calls = 0;
    server.use(http.post("/api/v1/portal/announcements/n1/open", () => (++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(detail()))));
    const user = userEvent.setup();
    const failed = setup("/portal/avisos?aviso=n1");
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: "Mudança de <b>horário</b>" })).toBeInTheDocument();
    failed.unmount();
    server.use(http.post("/api/v1/portal/announcements/n1/open", () => new HttpResponse(null, { status: 403 })));
    setup("/portal/avisos?aviso=n1");
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA2: pílulas com contagem refazem a leitura e mudam ?filtro=; trocar de aluno zera a modalidade", async () => {
    const asked: string[] = [];
    serve(({ request }) => {
      asked.push(new URL(request.url).search);
      return HttpResponse.json(
        data({
          students: [
            { id: "s1", name: "Ana Souza", self: true },
            { id: "s2", name: "Beto Souza", self: false },
          ],
          modalities: [
            { id: "m1", name: "Jiu-Jitsu", count: 2 },
            { id: "m2", name: "Judô", count: 1 },
          ],
        }),
      );
    });
    const user = userEvent.setup();
    setup("/portal/avisos?pagina=2");
    await screen.findByRole("list", { name: "Lista de avisos" });
    expect(asked.at(-1)).toBe("?page=2");
    for (const n of ["Todos 3", "Não lidos 2", "Jiu-Jitsu 2", "Judô 1"]) expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    expect(screen.queryByText("Por modalidade")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Não lidos 2" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?filter=UNREAD"));
    expect(where()).toBe("/portal/avisos?filtro=nao-lidos");
    expect(screen.getByRole("button", { name: "Não lidos 2" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Judô 1" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?filter=MODALITY&modalityId=m2"));
    expect(where()).toBe("/portal/avisos?filtro=modalidade&modalidade=m2");

    await user.selectOptions(screen.getByLabelText("Aluno"), "s2");
    await waitFor(() => expect(asked.at(-1)).toBe("?studentId=s2"));
    expect(where()).toBe("/portal/avisos?aluno=s2");

    await user.click(screen.getByRole("button", { name: "Não lidos 2" }));
    await user.click(screen.getByRole("button", { name: "Todos 3" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?studentId=s2"));
    expect(screen.getByRole("button", { name: "Todos 3" })).toHaveAttribute("aria-pressed", "true");
  });

  it("CA1: lista, Marcar todos como lidos limpa, relê e fica desligado sem não lidos", async () => {
    let cleared = 0;
    serve(() => HttpResponse.json(cleared ? data({ unreadCount: 0, items: data().items.map((i) => ({ ...i, unread: false })) }) : data()));
    server.use(
      http.post("/api/v1/portal/announcements/read-all", () => {
        cleared += 1;
        return HttpResponse.json({ dismissed: 2 });
      }),
    );
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("button", { name: /Marcar todos como lidos/ }));
    expect(await screen.findByText("2 avisos marcados como lidos.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Marcar todos como lidos/ })).toBeDisabled());
    expect(screen.queryByText("Não lido")).not.toBeInTheDocument();
    expect(cleared).toBe(1);
  });

  it("Marcar todos que falha mostra o erro", async () => {
    serve(data());
    server.use(http.post("/api/v1/portal/announcements/read-all", () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("button", { name: /Marcar todos como lidos/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível marcar os avisos como lidos");
  });

  it("CA4: lista, paginação: Próxima página e Página anterior mudam ?pagina=", async () => {
    const asked: string[] = [];
    serve(({ request }) => {
      asked.push(new URL(request.url).search);
      return HttpResponse.json(data({ total: 45 }));
    });
    const user = userEvent.setup();
    setup();
    await screen.findByText("Página 1 de 3");
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?page=2"));
    expect(where()).toBe("/portal/avisos?pagina=2");
    await user.click(await screen.findByRole("button", { name: "Página anterior" }));
    await waitFor(() => expect(where()).toBe("/portal/avisos"));
  });

  it("CA15: vazio (sem avisos e sem não lidos), carregando, erro com Tentar de novo e sem permissão", async () => {
    serve(data({ items: [], total: 0, unreadCount: 0 }));
    const empty = setup();
    expect(await screen.findByText("Nenhum aviso")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Marcar todos como lidos/ })).toBeDisabled();
    empty.unmount();

    serve(data({ items: [], total: 0, unreadCount: 0, filter: "UNREAD" }));
    const unread = setup("/portal/avisos?filtro=nao-lidos");
    expect(await screen.findByText("Nenhum aviso não lido")).toBeInTheDocument();
    unread.unmount();

    serve(() => new Promise<Response>(() => {}));
    const loading = setup();
    expect((await screen.findAllByRole("status")).length).toBeGreaterThan(0);
    loading.unmount();

    let calls = 0;
    serve(() => (++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(data())));
    const user = userEvent.setup();
    const failed = setup();
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("list", { name: "Lista de avisos" })).toBeInTheDocument();
    expect(calls).toBe(2);
    failed.unmount();

    serve(() => new HttpResponse(null, { status: 403 }));
    setup();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  for (const dark of [false, true]) {
    it(`CA15: sem violações de acessibilidade no tema ${dark ? "escuro" : "claro"}, com a lista e com o aviso aberto`, async () => {
      setDevicePrefersDark(dark);
      serve(data());
      server.use(http.post("/api/v1/portal/announcements/n1/open", () => HttpResponse.json(detail())));
      const { container } = setup();
      await screen.findByRole("list", { name: "Lista de avisos" });
      await waitFor(async () => expect(await axeViolations(container)).toEqual([]));
      const user = userEvent.setup();
      await user.click(screen.getAllByRole("button", { name: /Mudança de/ })[0]);
      await screen.findByText(/Linha um/);
      await waitFor(async () => expect(await axeViolations(document.body)).toEqual([]));
    });
  }
});
