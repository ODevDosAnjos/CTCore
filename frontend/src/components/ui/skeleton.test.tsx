import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";
import { LoadingState } from "@/components/states";

describe("Skeleton", () => {
  it("CA4: barra escondida do leitor, com o tamanho de quem usa", () => {
    const { container } = render(<Skeleton className="h-4 w-1/2" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveClass("animate-pulse", "h-4", "w-1/2");
  });

  it("CA4: LoadingState usa o esqueleto e deixa a frase só para leitor de tela", () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(container.querySelector(".sr-only")).toHaveTextContent("Carregando");
  });
});
