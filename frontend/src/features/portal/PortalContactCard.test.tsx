import { render, screen } from "@testing-library/react";
import { setDeviceNarrow } from "@/test/device";
import { PortalContactCard } from "./PortalContactCard";

const unit = { name: "Tijuca", address: null, whatsapp: "(21) 97000-1200", email: "tijuca@exemplo.example" };

describe("PortalContactCard (RF-POR-05, RN-INA-08)", () => {
  it("CA4: com WhatsApp e e-mail mostra o botão wa.me, o número e o e-mail", () => {
    render(<PortalContactCard unit={unit} />);
    expect(screen.getByRole("link", { name: "WhatsApp da unidade" })).toHaveAttribute("href", "https://wa.me/5521970001200");
    expect(screen.getByText("(21) 97000-1200 · tijuca@exemplo.example")).toBeInTheDocument();
    expect(screen.getByText(/Quer combinar o pagamento ou voltar a treinar\? A equipe da Tijuca/)).toBeInTheDocument();
  });

  it("CA4: sem WhatsApp não há botão; sem unidade não há cartão", () => {
    const { rerender } = render(<PortalContactCard unit={{ ...unit, whatsapp: null }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("tijuca@exemplo.example")).toBeInTheDocument();
    rerender(<PortalContactCard unit={null} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("CA4: no celular só o texto curto e o botão", () => {
    setDeviceNarrow(true);
    render(<PortalContactCard unit={unit} />);
    expect(screen.getByText("A equipe da Tijuca responde pelo WhatsApp.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "WhatsApp da unidade" })).toBeInTheDocument();
    expect(screen.queryByText(/tijuca@exemplo/)).not.toBeInTheDocument();
  });
});
