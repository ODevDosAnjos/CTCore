package br.com.ctcore.staff;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class StaffRulesTest {
    static final UUID A = new UUID(0, 1), B = new UUID(0, 2), C = new UUID(0, 3);

    @Test
    @DisplayName("CA12: unidade sem outro Administrador ativo fica sem Administrador")
    void lastAdministrator() {
        assertThat(StaffRules.leftWithoutAdministrator(Set.of(A, B), Map.of(B, 1))).containsExactly(A);
        assertThat(StaffRules.leftWithoutAdministrator(Set.of(A), Map.of(A, 2))).isEmpty();
        assertThat(StaffRules.removed(Set.of(A, B), Set.of(B, C))).containsExactly(A);
    }
}
