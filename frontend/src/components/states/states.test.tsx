import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockerChecklist } from "@/components/ui/blocker-checklist";
import { BlockedState, EmptyState, ErrorState, ForbiddenState, LinkExpiredState, LoadingState } from ".";

describe("componentes de estado (CA3)", () => {
  it("carregando tem role=status", () => {
    render(<LoadingState />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando...");
  });

  it("vazio mostra uma frase e a ação principal", () => {
    render(<EmptyState action={<button>Criar</button>} />);
    expect(screen.getByText("Nada por aqui ainda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument();
  });

  it("erro mostra as três partes e chama Tentar de novo", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Nada foi alterado nos seus dados.");
    expect(screen.getByText("Não conseguimos carregar as informações agora.")).toBeInTheDocument();
    expect(screen.getByText(/Tente de novo em instantes/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("sem permissão não mostra conteúdo", () => {
    render(<ForbiddenState />);
    expect(screen.getByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA21: carregando mostra esqueleto e o texto fica para leitor de tela", () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.getByText("Carregando...")).toHaveClass("sr-only");
  });

  it("CA21: vazio com título e texto próprios", () => {
    render(<EmptyState title="Sem alunos" text="Cadastre o primeiro." />);
    expect(screen.getByRole("heading", { name: "Sem alunos" })).toHaveClass("font-heading");
    expect(screen.getByText("Cadastre o primeiro.")).toBeInTheDocument();
  });
});

describe("estados no visual do canvas (#464)", () => {
  it("carregando em cartão tem role=status e aceita texto", () => {
    render(<LoadingState variant="card" text="Buscando…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando…");
  });

  it("vazio em cartão: título em caixa alta, texto e ação", () => {
    render(<EmptyState variant="card" title="Sem alunos" text="Cadastre." action={<button>Criar</button>} />);
    expect(screen.getByRole("heading", { name: "Sem alunos" })).toHaveClass("uppercase");
    expect(screen.getByText("Cadastre.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument();
  });

  it("erro em cartão chama onRetry e só mostra a ação secundária quando passada", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState variant="card" onRetry={onRetry} />);
    expect(screen.getByRole("heading", { name: "Não foi possível carregar" })).toBeInTheDocument();
    expect(screen.getByText("Nada foi alterado. Confira a sua conexão e tente de novo.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Falar" })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<ErrorState variant="card" onRetry={onRetry} title="Outro" secondary={<button>Falar</button>} />);
    expect(screen.getByRole("heading", { name: "Outro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Falar" })).toBeInTheDocument();
  });

  it("sem permissão em cartão com ação opcional", () => {
    render(<ForbiddenState variant="card" action={<button>Ir</button>} />);
    expect(screen.getByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir" })).toBeInTheDocument();
  });

  it("bloqueio: título, itens e Entendi dispara a ação", async () => {
    const onClose = vi.fn();
    render(
      <BlockedState title="Não dá para desativar" actions={<button onClick={onClose}>Entendi</button>}>
        <BlockerChecklist label="O que impede agora" items={[{ text: "Turma ativa" }]} />
      </BlockedState>,
    );
    expect(screen.getByRole("heading", { name: "Não dá para desativar" })).toBeInTheDocument();
    expect(screen.getByText("Turma ativa")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Entendi" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("link vencido: título, texto, campo e reenvio", async () => {
    const onSend = vi.fn();
    render(
      <LinkExpiredState title="Link vencido" text="Vale por 1 hora." actions={<><button onClick={onSend}>Enviar um link novo</button><button>Voltar para o login</button></>}>
        <input aria-label="E-mail" defaultValue="a@b.example" />
      </LinkExpiredState>,
    );
    expect(screen.getByText("Vale por 1 hora.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveValue("a@b.example");
    await userEvent.setup().click(screen.getByRole("button", { name: "Enviar um link novo" }));
    expect(onSend).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Voltar para o login" })).toBeInTheDocument();
  });
});
