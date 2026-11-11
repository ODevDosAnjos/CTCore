import { ageOf, dayMonthBefore, maskCpf, monthYear } from "./enrollmentFormat";

describe("enrollmentFormat", () => {
  it("idade conta o aniversário do ano", () => {
    const today = new Date(2026, 4, 10);
    expect(ageOf("2018-05-10", today)).toBe(8);
    expect(ageOf("2018-05-11", today)).toBe(7);
    expect(ageOf("1990-01-01", today)).toBe(36);
  });
  it("CPF mascarado mostra só o grupo do meio e o final", () => {
    expect(maskCpf("529.982.247-25")).toBe("***.982.***-25");
    expect(maskCpf("123")).toBe("");
  });
  it("mês e ano abreviados e dia anterior à data", () => {
    expect(monthYear("2026-10-08")).toBe("out/2026");
    expect(dayMonthBefore("2026-11-10", 10)).toBe("31/10");
    expect(dayMonthBefore("2026-03-05", 10)).toBe("23/02");
  });
});
