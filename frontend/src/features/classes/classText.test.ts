import i18n from "@/i18n";
import { hourText, scheduleText } from "./classText";

const t = i18n.t.bind(i18n);
const slot = (weekday: number, startsAt: string, endsAt: string) => ({ weekday, startsAt, endsAt });

describe("classText (RF-TUR-01, CA4)", () => {
  it("horas sem zero à esquerda e sem :00", () => {
    expect(["19:30", "21:00", "07:00", "08:30", "10:00"].map(hourText)).toEqual(["19h30", "21h", "7h", "8h30", "10h"]);
  });

  it("agrupa os dias de mesmo horário", () => {
    expect(scheduleText(t, [slot(5, "19:30", "21:00"), slot(1, "19:30", "21:00"), slot(3, "19:30", "21:00")])).toBe("Seg, Qua e Sex · 19h30–21h");
    expect(scheduleText(t, [slot(2, "07:00", "08:30"), slot(4, "07:00", "08:30"), slot(5, "07:00", "08:30")])).toBe("Ter, Qui e Sex · 7h–8h30");
    expect(scheduleText(t, [slot(2, "17:00", "18:00"), slot(4, "17:00", "18:00")])).toBe("Ter e Qui · 17h–18h");
    expect(scheduleText(t, [slot(6, "10:00", "11:30")])).toBe("Sáb · 10h–11h30");
  });

  it("horários diferentes viram um trecho por horário, separados por ' · '", () => {
    expect(scheduleText(t, [slot(1, "19:00", "20:00"), slot(3, "20:00", "21:00"), slot(5, "19:00", "20:00")])).toBe("Seg e Sex · 19h–20h · Qua · 20h–21h");
  });

  it("sem horário mostra o traço", () => {
    expect(scheduleText(t, [])).toBe("—");
  });
});
