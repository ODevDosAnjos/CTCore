package br.com.ctcore.organization;

import br.com.ctcore.api.error.ApiValidationException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/** RF-ORG-01: as cinco regras da organização (colunas de {@code organization_settings}) e as faixas aceitas. */
public record OrganizationRules(int deactivationDays, int formerStudentRetentionMonths, int trialRetentionMonths, int trialLimit,
        String crossUnitTraining) {
    static final Set<String> CROSS_UNIT = Set.of("plan", "allowed", "denied");

    /** Corpo do PATCH: campo ausente vira nulo e é recusado com o campo apontado ({@code rules.<campo>}). */
    public record Request(Integer deactivationDays, Integer formerStudentRetentionMonths, Integer trialRetentionMonths, Integer trialLimit,
            String crossUnitTraining) {}

    public static OrganizationRules validate(Request r) {
        return new OrganizationRules(
                range("deactivationDays", r.deactivationDays(), 15, 90),
                range("formerStudentRetentionMonths", r.formerStudentRetentionMonths(), 1, 60),
                range("trialRetentionMonths", r.trialRetentionMonths(), 1, 60),
                range("trialLimit", r.trialLimit(), 1, 3),
                crossUnit(r.crossUnitTraining()));
    }

    private static int range(String field, Integer value, int min, int max) {
        if (value == null) throw new ApiValidationException("rules." + field, "obrigatório");
        if (value < min || value > max) throw new ApiValidationException("rules." + field, "use um valor de " + min + " a " + max);
        return value;
    }

    private static String crossUnit(String value) {
        if (value == null || !CROSS_UNIT.contains(value)) throw new ApiValidationException("rules.crossUnitTraining", "use plan, allowed ou denied");
        return value;
    }

    Map<String, Object> auditValues() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("deactivationDays", deactivationDays);
        m.put("formerStudentRetentionMonths", formerStudentRetentionMonths);
        m.put("trialRetentionMonths", trialRetentionMonths);
        m.put("trialLimit", trialLimit);
        m.put("crossUnitTraining", crossUnitTraining);
        return m;
    }
}
