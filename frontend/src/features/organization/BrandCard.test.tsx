import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BrandCard } from "./BrandCard";
import type { OrganizationView } from "./useOrganization";

const view: OrganizationView = {
  name: "Academia Leão",
  holderDocument: null,
  holderName: null,
  logoUrl: null,
  version: 0,
  lastChange: null,
  rules: { deactivationDays: 30, formerStudentRetentionMonths: 12, trialRetentionMonths: 6, crossUnitTraining: "plan" },
  coordinator: null,
};
const show = (v: OrganizationView, canEdit = true) =>
  render(
    <BrandCard
      view={v}
      canEdit={canEdit}
      name={v.name}
      onName={vi.fn()}
      holderName={v.holderName ?? ""}
      onHolderName={vi.fn()}
      holder=""
      onHolder={vi.fn()}
      onHolderBlur={vi.fn()}
      uploadLogo={vi.fn()}
      removeLogo={vi.fn()}
    />,
  );

describe("BrandCard (R2)", () => {
  it("CA2: sem logo mostra as iniciais e Enviar logo, sem Remover, com a nota do tamanho", () => {
    show(view);
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar logo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover logo" })).not.toBeInTheDocument();
    expect(screen.getByText("JPG, PNG ou WebP · cortado em quadrado, 512 px")).toBeInTheDocument();
    expect(screen.queryByText(/sempre com "feito com ctcore" no rodapé/)).not.toBeInTheDocument();
  });

  it("CA2: com logo mostra a miniatura, Trocar logo e Remover logo", () => {
    show({ ...view, logoUrl: "data:image/png;base64,AAAA" });
    expect(screen.getByRole("img", { name: "Logo da organização" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar logo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover logo" })).toBeInTheDocument();
  });

  it("issue 768, CA5: o titular tem nome (até 160) e documento em campos separados; em leitura, os dois desabilitados", () => {
    show({ ...view, holderName: "Leão Ltda." }, false);
    expect(screen.getByLabelText("Titular (razão social ou nome)")).toHaveValue("Leão Ltda.");
    expect(screen.getByLabelText("Titular (razão social ou nome)")).toHaveAttribute("maxlength", "160");
    expect(screen.getByLabelText("Titular (razão social ou nome)")).toBeDisabled();
    expect(screen.getByLabelText("CNPJ ou CPF do titular")).toBeDisabled();
  });

  it("o nome é obrigatório e, somente leitura, não há botões de logo", () => {
    show(view, false);
    expect(screen.getByLabelText(/^Nome da organização/)).toBeDisabled();
    expect(screen.queryByRole("button", { name: /logo/ })).not.toBeInTheDocument();
  });
});
