package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.ctcore.api.error.ApiValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class OrganizationRulesTest {
    private static OrganizationRules.Request req(Integer days, Integer former, Integer trial, Integer limit, String cross) {
        return new OrganizationRules.Request(days, former, trial, limit, cross);
    }

    @Test
    @DisplayName("RF-ORG-01 / RN-ORG-13: limites das faixas são aceitos")
    void bounds() {
        assertThat(OrganizationRules.validate(req(15, 1, 1, 1, "plan"))).isEqualTo(new OrganizationRules(15, 1, 1, 1, "plan"));
        assertThat(OrganizationRules.validate(req(90, 60, 60, 3, "allowed"))).isEqualTo(new OrganizationRules(90, 60, 60, 3, "allowed"));
        assertThat(OrganizationRules.validate(req(30, 12, 6, 2, "denied")).crossUnitTraining()).isEqualTo("denied");
    }

    @Test
    @DisplayName("RF-ORG-01: fora da faixa, nulo ou valor desconhecido aponta rules.<campo>")
    void invalid() {
        assertField(req(14, 12, 6, 2, "plan"), "rules.deactivationDays");
        assertField(req(91, 12, 6, 2, "plan"), "rules.deactivationDays");
        assertField(req(30, 0, 6, 2, "plan"), "rules.formerStudentRetentionMonths");
        assertField(req(30, 12, 61, 2, "plan"), "rules.trialRetentionMonths");
        assertField(req(30, 12, 6, 4, "plan"), "rules.trialLimit");
        assertField(req(30, 12, 6, null, "plan"), "rules.trialLimit");
        assertField(req(30, 12, 6, 2, null), "rules.crossUnitTraining");
        assertField(req(30, 12, 6, 2, "maybe"), "rules.crossUnitTraining");
    }

    private static void assertField(OrganizationRules.Request r, String field) {
        assertThatThrownBy(() -> OrganizationRules.validate(r)).isInstanceOf(ApiValidationException.class).hasMessageContaining(field);
    }
}
