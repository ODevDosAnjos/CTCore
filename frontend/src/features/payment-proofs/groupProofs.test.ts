import { groupProofs, referenceLabel } from "./groupProofs";
import type { PaymentProof } from "./types";

const proof = (over: Partial<PaymentProof>): PaymentProof => ({
  id: "p", chargeId: "c", studentId: "s1", studentName: "Lucas Almeida", studentPhotoUrl: null, unitId: "u", unit: "Barra", reference: "Jiu-Jitsu · 10/2026", amountCents: 19000,
  dueOn: "2026-10-10", sentAt: "2026-10-08T11:12:00Z", status: "PENDING", contentType: "image/png", imageUrl: null, refusalReason: null, decidedAt: null, unitPixKey: null, ...over,
});

describe("groupProofs (RN-COB-14, D7)", () => {
  it("junta o mesmo aluno e o mesmo instante num item só, com o valor somado e o rótulo do canvas", () => {
    const groups = groupProofs([proof({ id: "a" }), proof({ id: "b", reference: "Muay Thai · 10/2026", amountCents: 17000 })]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ totalCents: 36000, label: "Jiu-Jitsu e Muay Thai · out/2026" });
    expect(groups[0].items.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("mesmo aluno em instantes diferentes, ou alunos diferentes no mesmo instante, são itens separados, na ordem de envio", () => {
    const groups = groupProofs([proof({ id: "a" }), proof({ id: "b", sentAt: "2026-10-09T11:12:00Z" }), proof({ id: "c", studentId: "s2", studentName: "Outra Pessoa" })]);
    expect(groups.map((g) => g.items.map((p) => p.id))).toEqual([["a"], ["b"], ["c"]]);
    expect(groups[0].label).toBe("Jiu-Jitsu · out/2026");
  });

  it("meses diferentes ou avulsa listam a referência de cada cobrança", () => {
    const groups = groupProofs([proof({ id: "a" }), proof({ id: "b", reference: "Kimono", amountCents: 9000 })]);
    expect(groups[0].label).toBe("Jiu-Jitsu · out/2026 e Kimono");
    expect(referenceLabel("10/2026")).toBe("out/2026");
    expect(referenceLabel("Camiseta")).toBe("Camiseta");
  });
});
