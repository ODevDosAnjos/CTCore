import { render, screen } from "@testing-library/react";
import { AssistantSummary } from "./AssistantSummary";

describe("AssistantSummary", () => {
  it("CA2: mostra aluno com idade, responsável financeira e unidade", () => {
    render(<AssistantSummary name="Aluno Teste" age={8} financial="Mãe Teste" unit="Centro" />);
    expect(screen.getByText("Aluno Teste · 8 anos")).toBeInTheDocument();
    expect(screen.getByText("Mãe Teste")).toBeInTheDocument();
    expect(screen.getByText("Centro")).toBeInTheDocument();
  });
  it("sem a ficha, só o nome; sem responsável nem unidade, as linhas somem", () => {
    render(<AssistantSummary name="Aluno Teste" />);
    expect(screen.getByText("Aluno Teste")).toBeInTheDocument();
    expect(screen.queryByText("Unidade")).toBeNull();
    expect(screen.queryByText("Responsável financeira")).toBeNull();
  });
});
