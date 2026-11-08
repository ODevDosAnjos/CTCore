import { render, screen } from "@testing-library/react";
import { ModalityDot } from "./modality-dot";
import { axeViolations } from "@/test/axe";

it.each(["light", "dark"])("CA3/CA8: tom estável, nome ao lado e axe no tema %s", async (theme) => {
  document.documentElement.dataset.theme = theme;
  const { container, unmount } = render(<ModalityDot name="Jiu-jitsu" />);
  expect(screen.getByText("Jiu-jitsu")).toBeInTheDocument();
  const tone = container.querySelector("[data-tone]")!.getAttribute("data-tone");
  expect(await axeViolations(container)).toEqual([]);
  unmount();
  const again = render(<ModalityDot name="Jiu-jitsu" />);
  expect(again.container.querySelector("[data-tone]")!.getAttribute("data-tone")).toBe(tone);
});
