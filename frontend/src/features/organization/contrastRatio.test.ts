import { contrastRatio, isHexColor, MIN_CONTRAST, passesContrast, suggestColor } from "./contrastRatio";

describe("contrastRatio (CA7)", () => {
  it("valores de referência: preto 21:1, branco 1:1, cinza #767676 acima do limite e #777777 abaixo", () => {
    expect(contrastRatio("#000000")).toBeCloseTo(21, 3);
    expect(contrastRatio("#ffffff")).toBeCloseTo(1, 3);
    expect(contrastRatio("#767676")).toBeCloseTo(4.54, 2);
    expect(passesContrast("#767676")).toBe(true);
    expect(passesContrast("#777777")).toBe(false);
    expect(MIN_CONTRAST).toBe(4.5);
  });

  it("#1a56db passa e #ffeb3b reprova; maiúsculas valem", () => {
    expect(passesContrast("#1a56db")).toBe(true);
    expect(passesContrast("#1A56DB")).toBe(true);
    expect(passesContrast("#ffeb3b")).toBe(false);
  });

  it("formato #RRGGBB", () => {
    expect(isHexColor("#1a56db")).toBe(true);
    for (const bad of ["azul", "#fff", "1a56db", "#1a56dg", ""]) expect(isHexColor(bad)).toBe(false);
  });
});

describe("suggestColor (B5, R4)", () => {
  it("escurece a cor sem contraste até 4,5:1, mantendo o matiz; a que já passa volta igual", () => {
    for (const bad of ["#F5E663", "#F4C430", "#ffeb3b", "#ffffff"]) {
      const suggestion = suggestColor(bad);
      expect(isHexColor(suggestion)).toBe(true);
      expect(contrastRatio(suggestion)).toBeGreaterThanOrEqual(MIN_CONTRAST);
      expect(contrastRatio(suggestion)).toBeLessThan(MIN_CONTRAST + 0.6);
    }
    expect(suggestColor("#F4C430")).toMatch(/^#[0-9A-F]{6}$/);
    expect(suggestColor("#23427A")).toBe("#23427A");
  });
});
