package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.billing.BillingFixtures;
import br.com.ctcore.identity.Role;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RN-ORG-11 (#484, CA10): cobrança em conferência da unidade impede desativar; a de outra unidade ou organização não conta. Contagem real, sem mock. */
class UnitPendingProofsIT extends UnitBase {
    private int pendingProofs(Tenant t, UUID unit) throws Exception {
        var check = body(call(MockMvcRequestBuilders.get("/api/v1/units/" + unit + "/deactivation-check"), who(t, Role.COORDINATOR)).getResponse());
        assertThat(check.path("canDeactivate").asBoolean()).isEqualTo(check.path("pendingProofs").asInt() == 0);
        return check.path("pendingProofs").asInt();
    }

    private void charge(Tenant t, UUID unit, String status) {
        UUID student = BillingFixtures.student(adminJdbc(), t.orgId(), unit, "Aluno " + UUID.randomUUID());
        BillingFixtures.oneOff(adminJdbc(), t.orgId(), unit, student, 5000, status);
    }

    @Test
    @DisplayName("CA10: conta só IN_REVIEW da própria unidade")
    void countsOnlyOwnUnit() throws Exception {
        var a = tenant();
        var other = addUnit(a, "Outra", "outra-" + a.orgId(), "Rio");
        var b = tenant();
        addUnit(b, "Outra", "outra-" + b.orgId(), "Rio");
        assertThat(pendingProofs(a, a.unitId())).isZero();
        charge(a, a.unitId(), "IN_REVIEW");
        charge(a, a.unitId(), "OPEN");
        charge(a, other, "IN_REVIEW");
        charge(b, b.unitId(), "IN_REVIEW");
        assertThat(pendingProofs(a, a.unitId())).isEqualTo(1);
        assertThat(pendingProofs(a, other)).isEqualTo(1);
        assertThat(pendingProofs(b, b.unitId())).isEqualTo(1);
        BillingFixtures.clean(adminJdbc());
    }
}
