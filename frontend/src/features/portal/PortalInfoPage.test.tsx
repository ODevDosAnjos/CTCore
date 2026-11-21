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
import type { PortalInfoData } from "./usePortalInfo";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "Ana Silva" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "GUARDIAN", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const jiu = { id: "m1", name: "Jiu-Jitsu" };
const centro = { id: "u1", name: "Unidade Centro", phone: "2133334444", whatsapp: null, email: "centro@exemplo.test" };
const level = (id: string, degree: number, achievedOn: string | null, origin = false) => ({ id, levelName: "Azul", color: "#1E40AF", secondaryColor: null, degree, achievedOn, origin });
const info = (over: Partial<PortalInfoData> = {}): PortalInfoData => ({
  reduced: false,
  students: [{ id: "s1", name: "Ana Souza", photoUrl: null, self: true }],
  selectedStudentId: "s1",
  personal: {
    name: "Ana Souza",
    birthDate: "1990-03-10",
    maskedCpf: "***.***.***-25",
    photoUrl: null,
    phone: "21900000001",
    email: "ana@exemplo.test",
    address: { postalCode: "01001000", street: "Rua Fictícia", number: "1", complement: null, district: "Centro", city: "Rio de Janeiro", state: "RJ" },
    emergency: { name: null, relationship: null, phone: null },
    canEdit: true,
    editableFields: ["phone", "photo"],
  },
  unitContacts: [centro],
  trainings: [
    {
      modality: jiu,
      unit: centro,
      mainClass: { clazz: { id: "c1", name: "Jiu-Jitsu Adulto" }, teacherName: "Fictício", schedule: [{ weekday: 1, startsAt: "19:00", endsAt: "20:00" }] },
      otherClasses: [{ clazz: { id: "c2", name: "Livre" }, teacherName: "Outro", schedule: [{ weekday: 5, startsAt: "20:00", endsAt: "21:00" }] }],
    },
  ],
  plans: [
    {
      modality: jiu,
      plan: { id: "p1", name: "Mensal" },
      planCents: 20000,
      benefit: { type: "PERCENT", value: 10, validUntil: null },
      benefitCents: 2000,
      monthlyCents: 18000,
      dueDay: 5,
      nextPlan: null,
    },
  ],
  graduation: [{ modality: jiu, belt: level("l2", 2, "2026-10-01"), history: [level("l2", 2, "2026-10-01"), level("l0", 0, null, true)] }],
  emailAnnouncements: true,
  terms: { enrollment: { version: 1, acceptedAt: "2026-01-10T12:00:00Z" }, imageUse: { granted: true, version: 1, at: "2026-01-10T12:00:00Z" } },
  ...over,
});
type Resolver = (i: { request: Request }) => Response | Promise<Response>;
const serve = (data: PortalInfoData | Resolver) => server.use(http.get("/api/v1/portal/info", typeof data === "function" ? data : () => HttpResponse.json(data)));

function setup(path = "/portal/minhas-informacoes", reduced = false) {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/portal/term", () => HttpResponse.json([])),
    http.get("/api/v1/portal/students", () => HttpResponse.json([])),
    http.get("/api/v1/portal/students/:id/requests", () => HttpResponse.json([])),
    http.get("/api/v1/auth/sessions", () => HttpResponse.json([])),
    http.get("/api/v1/portal/shell", () => HttpResponse.json({ organization: { name: "Academia Alfa", color: null, logoUrl: null }, reduced, unreadAnnouncements: 0 })),
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
const card = (name: string) => screen.getByRole("heading", { name }).closest("section") as HTMLElement;

describe("PortalInfoPage (RF-POR-07)", () => {
  it("celular (canvas PortalMInfo): título Eu, dados enxutos, Treinos e menu de linhas com Em breve", async () => {
    setDeviceNarrow(true);
    try {
      serve(info());
      setup();
      expect(await screen.findByRole("heading", { level: 1, name: "Eu" })).toBeInTheDocument();
      await screen.findByRole("heading", { name: "Dados pessoais" }); // a tela só abre depois da moldura (RNF-43)
      const personal = card("Dados pessoais");
      expect(within(personal).queryByText("Nascimento")).not.toBeInTheDocument();
      expect(within(personal).getByText("Rua Fictícia, 1")).toBeInTheDocument();
      expect(within(personal).getByRole("button", { name: "Editar" })).toBeInTheDocument();
      const menu = screen.getByRole("list", { name: "Mais opções" });
      expect(within(menu).getByRole("link", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
      expect(within(menu).getByRole("button", { name: "Termos e uso de imagem" })).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(within(menu).getByRole("button", { name: "Preferências de e-mail" }));
      expect(await within(menu).findByRole("switch")).toBeInTheDocument();
      for (const name of ["Baixar meus dados", "Excluir minha conta", "Instalar o app"]) expect(within(menu).getByRole("link", { name })).toHaveAttribute("aria-disabled", "true");
    } finally {
      setDeviceNarrow(false);
    }
  });

  it("dados: mostra o CPF mascarado, o telefone e o endereço; sem CPF completo", async () => {
    serve(info());
    setup();
    await screen.findByRole("heading", { name: "Dados pessoais" });
    const personal = card("Dados pessoais");
    expect(within(personal).getByText("***.***.***-25")).toBeInTheDocument();
    expect(within(personal).getByText("(21) 90000-0001")).toBeInTheDocument();
    expect(within(personal).getByText(/Rua Fictícia, 1 · Centro · Rio de Janeiro\/RJ · CEP 01001000/)).toBeInTheDocument();
    expect(within(personal).getByText("Não informado", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Carteirinha" })).toHaveAttribute("href", "/portal/carteirinha");
    expect(screen.getByRole("heading", { level: 1, name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.getByText("Minhas informações", { selector: "p" })).toBeInTheDocument();
    expect(within(personal).getByText("ana@exemplo.test · trocar exige confirmação")).toBeInTheDocument();
    expect(within(personal).getByText("Nome, CPF e nascimento só a academia altera.")).toBeInTheDocument();
  });

  it("dados: editar o contato envia só os campos da lista e mostra o dado novo", async () => {
    const body: unknown[] = [];
    let street = "Rua Fictícia";
    serve(() => HttpResponse.json(info({ personal: { ...info().personal, address: { ...info().personal.address, street } } })));
    server.use(
      http.put("/api/v1/portal/students/s1/contact", async ({ request }) => {
        const sent = (await request.json()) as Record<string, string>;
        body.push(sent);
        street = sent.street;
        return HttpResponse.json(info().personal);
      }),
    );
    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Editar contato" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar contato" });
    const field = within(dialog).getByLabelText("Logradouro");
    await user.clear(field);
    await user.type(field, "Rua Nova");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(Object.keys(body[0] as object).sort()).toEqual(["city", "complement", "district", "emergencyName", "emergencyPhone", "emergencyRelationship", "number", "phone", "postalCode", "state", "street"]);
    expect(await screen.findByText(/Rua Nova, 1/)).toBeInTheDocument();
  });

  it("dados: erro 422 do servidor aparece no campo e a janela continua aberta; emergência incompleta nem sai", async () => {
    let calls = 0;
    serve(info());
    server.use(
      http.put("/api/v1/portal/students/s1/contact", () => {
        calls += 1;
        return HttpResponse.json({ code: "UNPROCESSABLE", fields: [{ field: "city", message: "x" }] }, { status: 422 });
      }),
    );
    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Editar contato" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Nome do contato"), "Mãe");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await within(dialog).findByText(/Informe nome, parentesco e telefone/)).toBeInTheDocument();
    expect(calls).toBe(0);
    await user.clear(within(dialog).getByLabelText("Nome do contato"));
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await within(dialog).findByText("Confira este campo.")).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it("dados: remover a foto chama o servidor", async () => {
    let removed = 0;
    serve(info({ personal: { ...info().personal, photoUrl: "http://x.test/f.png" } }));
    server.use(http.delete("/api/v1/portal/students/s1/photo", () => (removed++, HttpResponse.json(info().personal))));
    setup();
    await userEvent.setup().click(await screen.findByRole("button", { name: "Remover foto" }));
    await waitFor(() => expect(removed).toBe(1));
  });

  it("dados: trocar a foto (escolher, recortar, enviar) mostra a nova", async () => {
    // jsdom não decodifica imagem nem desenha em canvas: Image, URL e canvas são simulações (como no teste do recorte).
    class FakeImage {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);
    URL.createObjectURL = vi.fn(() => "blob:foto");
    URL.revokeObjectURL = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb: BlobCallback) => cb(new Blob(["x"], { type: "image/png" }))) as never;
    try {
      let sent = "";
      let uploaded = false;
      serve(() => HttpResponse.json(info({ personal: { ...info().personal, photoUrl: uploaded ? "http://x.test/nova.png" : null } })));
      server.use(
        http.put("/api/v1/portal/students/s1/photo", async ({ request }) => {
          sent = request.headers.get("content-type") ?? "";
          uploaded = true;
          return HttpResponse.json({ ...info().personal, photoUrl: "http://x.test/nova.png" });
        }),
      );
      setup();
      const user = userEvent.setup();
      await screen.findByRole("button", { name: "Escolher foto" });
      expect(document.querySelector("img[src='http://x.test/nova.png']")).toBeNull();
      await user.upload(screen.getByLabelText("Arquivo da foto"), new File(["x"], "eu.png", { type: "image/png" }));
      const confirm = await screen.findByRole("button", { name: "Usar este corte" });
      await waitFor(() => expect(confirm).toBeEnabled());
      await user.click(confirm);
      await waitFor(() => expect(document.querySelector("img[src='http://x.test/nova.png']")).not.toBeNull());
      expect(sent).toContain("multipart/form-data");
      expect(await screen.findByRole("button", { name: "Trocar foto" })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("treinos: tabela com modalidade, turma principal com dia e professor, outros horários, plano, benefício e mensalidade; Fazer um pedido; sem contato do professor", async () => {
    serve(info());
    setup();
    await screen.findByRole("heading", { name: "Treinos" });
    const trainings = card("Treinos");
    const row = within(trainings).getByRole("row", { name: /Jiu-Jitsu/ });
    expect(within(row).getByText("Jiu-Jitsu Adulto · Seg 19:00 · Fictício")).toBeInTheDocument();
    expect(within(row).getByText("Livre (Sex 20:00)")).toBeInTheDocument();
    expect(within(row).getByText(/Mensal · R\$\s200,00 · 10% de desconto/)).toBeInTheDocument();
    expect(within(row).getByText(/R\$\s180,00 · dia 5/)).toBeInTheDocument();
    expect(within(row).getByText("Ativa")).toBeInTheDocument();
    expect(within(trainings).getByRole("link", { name: "Fazer um pedido" })).toHaveAttribute("href", "/portal/pedidos");
    expect(screen.queryByRole("heading", { name: "Plano e mensalidade" })).not.toBeInTheDocument();
    expect(trainings.textContent).not.toMatch(/\(21\) 3333-4444/);
  });

  it("graduação: faixa atual e histórico com a marca de origem", async () => {
    serve(info());
    setup();
    await screen.findByRole("heading", { name: "Graduação" });
    const grad = card("Graduação");
    expect(within(grad).getAllByText("Azul, grau 2").length).toBeGreaterThanOrEqual(2);
    expect(within(grad).getByText("De origem")).toBeInTheDocument();
    expect(grad.textContent).not.toMatch(/progress/i);
  });

  it("preferências e termos: desligar o e-mail grava; revogar o uso de imagem grava e relê", async () => {
    let prefs: unknown;
    let image: unknown;
    let granted = true;
    serve(() => HttpResponse.json(info({ terms: { ...info().terms, imageUse: { granted, version: 1, at: "2026-01-10T12:00:00Z" } } })));
    server.use(
      http.put("/api/v1/auth/email-preferences", async ({ request }) => HttpResponse.json((prefs = await request.json()))),
      http.put("/api/v1/portal/students/s1/image-use", async ({ request }) => {
        image = await request.json();
        granted = false;
        return HttpResponse.json({ granted });
      }),
    );
    setup();
    const user = userEvent.setup();
    const toggle = await screen.findByRole("switch", { name: "Comunicados da academia" });
    expect(screen.getByText("Cobranças, lembretes, recibos e avisos de aula sempre chegam")).toBeInTheDocument();
    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
    await waitFor(() => expect(prefs).toEqual({ announcements: false }));
    const terms = card("Termos");
    expect(within(terms).getByText("Aceito em 10/01/2026 · versão 1")).toBeInTheDocument();
    expect(within(terms).getByText("Autorizado em 10/01/2026")).toBeInTheDocument();
    await user.click(within(terms).getByRole("button", { name: "Revogar" }));
    expect(image).toBeUndefined();
    const dialog = await screen.findByRole("dialog", { name: "Revogar uso de imagem" });
    expect(within(dialog).getByText("Resumo")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
    expect(within(dialog).getByText(/Revogado em \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Revogar" }));
    await waitFor(() => expect(image).toEqual({ granted: false }));
    expect(await within(card("Termos")).findByText("Não autorizado")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Revogar uso de imagem" })).not.toBeInTheDocument();
  });

  describe("revogar uso de imagem pede confirmação (CA1, CA4, CA5, CA6)", () => {
    const putImage = (calls: unknown[], status = 200) =>
      http.put("/api/v1/portal/students/s1/image-use", async ({ request }) => {
        calls.push(await request.json());
        return status === 200 ? HttpResponse.json({ granted: false }) : new HttpResponse(null, { status });
      });

    it("Cancelar e Esc fecham sem chamada; o foco volta ao botão", async () => {
      const calls: unknown[] = [];
      serve(info());
      server.use(putImage(calls));
      setup();
      const user = userEvent.setup();
      const open = await within(await screen.findByRole("heading", { name: "Termos" }).then(() => card("Termos"))).findByRole("button", { name: "Revogar" });
      await user.click(open);
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(open);
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(open).toHaveFocus());
      expect(calls).toEqual([]);
    });

    it("Conceder uso de imagem chama direto, sem janela", async () => {
      const calls: unknown[] = [];
      serve(info({ terms: { ...info().terms, imageUse: { granted: false, version: null, at: null } } }));
      server.use(http.get("/api/v1/portal/students/s1/image-use", () => HttpResponse.json({ version: 1 })), putImage(calls));
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole("button", { name: "Conceder" }));
      await waitFor(() => expect(calls).toEqual([{ granted: true, version: 1 }]));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("API com erro: mostra a mensagem do cartão e fecha a janela", async () => {
      const calls: unknown[] = [];
      serve(info());
      server.use(putImage(calls, 500));
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole("button", { name: "Revogar" }));
      await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Revogar" }));
      expect(await within(card("Termos")).findByText("Não foi possível salvar. Tente de novo.")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(calls).toHaveLength(1);
    });

    for (const dark of [false, true]) {
      it(`axe: janela aberta sem violações no tema ${dark ? "escuro" : "claro"}`, async () => {
        setDevicePrefersDark(dark);
        serve(info());
        setup();
        const user = userEvent.setup();
        await user.click(await screen.findByRole("button", { name: "Revogar" }));
        await screen.findByRole("dialog");
        expect(await axeViolations(document.body)).toEqual([]);
      });
    }
  });

  it("pedidos, conta e privacidade: lista os pedidos, mostra Minha conta e deixa baixar, excluir e instalar visíveis e desabilitados sem chamada", async () => {
    const calls: string[] = [];
    serve(info());
    setup();
    server.use(
      http.get("/api/v1/portal/students/s1/requests", () =>
        HttpResponse.json([
          { id: "r1", kind: "CLASS_CHANGE", status: "OPEN", createdAt: "2026-10-20T12:00:00Z" },
          { id: "r2", kind: "PLAN_CHANGE", status: "REFUSED", createdAt: "2026-10-10T12:00:00Z" },
        ]),
      ),
      http.all("/api/v1/portal/*download*", () => (calls.push("x"), HttpResponse.json({}))),
    );
    await screen.findByRole("heading", { name: "Últimos pedidos" });
    const requests = card("Últimos pedidos");
    expect(await within(requests).findByText("Troca de turma · Aberto · 20/10/2026")).toBeInTheDocument();
    expect(within(requests).getByText("Troca de plano · Recusado · 10/10/2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
    for (const name of ["Senha", "E-mail", "Verificação em duas etapas", "Sessões ativas"]) expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();
    for (const name of ["Baixar meus dados", "Excluir minha conta", "Instalar o app"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("aria-disabled", "true");
      await userEvent.setup().click(button);
    }
    expect(screen.getAllByText("Em breve").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText(/ficam disponíveis em breve/)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  for (const dark of [false, true]) {
    it(`CA5/CA7: pedidos mostram carregando enquanto busca, sem violações no axe no tema ${dark ? "escuro" : "claro"}`, async () => {
      setDevicePrefersDark(dark);
      serve(info());
      const view = setup();
      server.use(http.get("/api/v1/portal/students/s1/requests", () => new Promise<Response>(() => {})));
      await screen.findByRole("heading", { name: "Últimos pedidos" });
      expect(within(card("Últimos pedidos")).getByRole("status")).toBeInTheDocument();
      expect(await axeViolations(view.container)).toEqual([]);
    });
  }

  it("CA5: pedidos mostram sem permissão no 403", async () => {
    serve(info());
    setup();
    server.use(http.get("/api/v1/portal/students/s1/requests", () => new HttpResponse(null, { status: 403 })));
    await screen.findByRole("heading", { name: "Últimos pedidos" });
    expect(await within(card("Últimos pedidos")).findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  for (const dark of [false, true]) {
    it(`CA5/CA7: pedidos mostram erro com retry que refaz só essa busca, sem violações no axe no tema ${dark ? "escuro" : "claro"}`, { timeout: 40000 }, async () => {
      setDevicePrefersDark(dark);
      let fail = true;
      let calls = 0;
      serve(info());
      const view = setup();
      server.use(
        http.get("/api/v1/portal/students/s1/requests", () => {
          calls++;
          return fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([]);
        }),
      );
      await screen.findByRole("heading", { name: "Últimos pedidos" });
      const retry = await within(card("Últimos pedidos")).findByRole("button", { name: "Tentar de novo" });
      expect(await axeViolations(view.container)).toEqual([]);
      fail = false;
      const before = calls;
      await userEvent.click(retry);
      expect(await within(card("Últimos pedidos")).findByText("Você ainda não fez pedidos")).toBeInTheDocument();
      expect(calls).toBe(before + 1);
    });
  }

  it("portal reduzido: dados, contato da unidade, preferências, termos e conta; sem treinos, plano, graduação nem pedidos", async () => {
    serve(info({ reduced: true, trainings: [], plans: [], graduation: [] }));
    setup("/portal/minhas-informacoes", true);
    await screen.findByRole("heading", { name: "Dados pessoais" });
    expect(screen.getByRole("heading", { name: "Contato da unidade" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preferências de e-mail" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Termos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conta e dados" })).toBeInTheDocument();
    expect(screen.getByText("Treinos, plano, graduação e pedidos voltam a aparecer quando uma modalidade estiver ativa de novo.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "WhatsApp da unidade" })).not.toBeInTheDocument();
    for (const name of ["Treinos", "Plano e mensalidade", "Graduação", "Últimos pedidos"]) expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();
  });

  it("portal reduzido: com WhatsApp na unidade mostra o botão verde que abre o wa.me", async () => {
    serve(info({ reduced: true, trainings: [], plans: [], graduation: [], unitContacts: [{ ...centro, whatsapp: "21999990000" }] }));
    setup("/portal/minhas-informacoes", true);
    expect(await screen.findByRole("link", { name: "WhatsApp da unidade" })).toHaveAttribute("href", "https://wa.me/5521999990000");
  });

  it("contato: Cancelar e Esc fecham sem gravar; os campos seguem a ordem do canvas", async () => {
    let calls = 0;
    serve(info());
    server.use(http.put("/api/v1/portal/students/s1/contact", () => (calls++, HttpResponse.json(info().personal))));
    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Editar contato" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar contato" });
    const labels = within(dialog).getAllByRole("textbox").map((el) => el.getAttribute("id"));
    expect(labels.length).toBeGreaterThan(5);
    const order = ["Celular", "CEP", "Logradouro", "Complemento", "Nome do contato"].map((l) => within(dialog).getByLabelText(l));
    const all = Array.from(dialog.querySelectorAll("input, select"));
    const idx = order.map((el) => all.indexOf(el as Element));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    expect(within(dialog).getByText(/Para trocar o e-mail, use Minha conta./)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Editar contato" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(calls).toBe(0);
  });

  for (const dark of [false, true]) {
    it(`axe: janela Editar contato sem violações no tema ${dark ? "escuro" : "claro"}`, async () => {
      setDevicePrefersDark(dark);
      serve(info());
      setup();
      await userEvent.setup().click(await screen.findByRole("button", { name: "Editar contato" }));
      await screen.findByRole("dialog", { name: "Editar contato" });
      expect(await axeViolations(document.body)).toEqual([]);
    });
  }

  it("vazio: aluno sem modalidade mostra o vazio dos treinos, os dados, os termos e a conta", async () => {
    serve(info({ trainings: [], plans: [], graduation: [] }));
    setup();
    expect(await screen.findByText("Nenhum treino")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dados pessoais" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Termos" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Graduação" })).not.toBeInTheDocument();
  });

  it("responsável: os chips trocam de aluno, refaz a leitura, mantêm os chips na tela e mudam ?aluno=", async () => {
    const asked: (string | null)[] = [];
    const two = [
      { id: "s1", name: "Ana Souza", photoUrl: null, self: false },
      { id: "s2", name: "Beto Souza", photoUrl: null, self: false },
    ];
    serve(({ request }) => {
      const id = new URL(request.url).searchParams.get("studentId");
      asked.push(id);
      const selected = id ?? "s1";
      return HttpResponse.json(info({ students: two, selectedStudentId: selected, personal: { ...info().personal, name: two.find((s) => s.id === selected)!.name } }));
    });
    setup();
    await screen.findByText("Ana Souza", { selector: "dd" });
    const chips = screen.getByRole("group", { name: "Aluno" });
    expect(within(chips).getByRole("button", { name: "Ana Souza" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.setup().click(within(chips).getByRole("button", { name: "Beto Souza" }));
    expect(screen.getByRole("group", { name: "Aluno" })).toBeInTheDocument();
    expect(await screen.findByText("Beto Souza", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Beto Souza" })).toBeInTheDocument();
    expect(asked).toEqual([null, "s2"]);
  });

  it("estados: carregando, erro com Tentar de novo e sem permissão", async () => {
    let fail = true;
    serve(() => (fail ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(info())));
    setup();
    expect(screen.getByRole("status")).toBeInTheDocument();
    const user = userEvent.setup();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByRole("heading", { name: "Dados pessoais" })).toBeInTheDocument();
  });

  it("estados: 403 mostra o sem permissão", async () => {
    serve(() => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    setup();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  for (const dark of [false, true]) {
    it(`axe: sem violações no tema ${dark ? "escuro" : "claro"}`, async () => {
      setDevicePrefersDark(dark);
      serve(info());
      const { container } = setup();
      await screen.findByRole("heading", { name: "Graduação" });
      expect(await axeViolations(container)).toEqual([]);
    });
  }
});
