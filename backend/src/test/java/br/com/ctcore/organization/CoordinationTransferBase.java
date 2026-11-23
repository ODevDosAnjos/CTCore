package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Codes;
import br.com.ctcore.identity.Role;
import br.com.ctcore.identity.TwoFactorService;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** Apoio dos testes da transferência de coordenação (RF-ORG-06): membros com sessão e token de reautenticação reais. */
abstract class CoordinationTransferBase extends OrganizationBase {
    @Autowired TwoFactorService twoFactor;

    /** Conta com vínculo ativo, sessão real e um token de reautenticação de TRANSFER_COORDINATION. */
    class Member {
        final UUID account = UUID.randomUUID();
        final UUID session = UUID.randomUUID();
        final UUID link = UUID.randomUUID();
        final String email = account + "@synthetic.example";
        final String sessionToken = "session-" + account;
        final String reauth = "reauth-" + account;
        final Role role;
        final Tenant tenant;

        Member(Tenant tenant, Role role, String linkStatus) {
            this.tenant = tenant;
            this.role = role;
            adminJdbc().update("insert into account (id, email, name, status) values (?, ?, 'Synthetic', 'ACTIVE')", account, email);
            adminJdbc().update("insert into account_link (id, account_id, organization_id, role, status) values (?, ?, ?, ?, ?)",
                    link, account, tenant.orgId(), role.name(), linkStatus);
            adminJdbc().update("insert into account_session (id, account_id, token_hash, active_link_id, expires_at) "
                    + "values (?, ?, ?, ?, now() + interval '1 hour')", session, account, Codes.hash(sessionToken), link);
            token("TRANSFER_COORDINATION", reauth);
            if (role == Role.COORDINATOR) twoFactor();
        }

        void twoFactor() {
            adminJdbc().update("insert into account_two_factor (account_id, secret_encrypted, enabled_at) values (?, 'x', now())", account);
        }

        void token(String action, String value) {
            adminJdbc().update("insert into reauth_token (account_id, session_id, action, token_hash, expires_at) "
                    + "values (?, ?, ?, ?, now() + interval '5 minutes')", account, session, action, Codes.hash(value));
        }

        AccountPrincipal principal() {
            return new AccountPrincipal(account, session, link, tenant.orgId(), role, Set.of(tenant.unitId()));
        }

        String role() {
            return adminJdbc().queryForObject("select role from account_link where id = ?", String.class, link);
        }

        List<UUID> units() {
            return adminJdbc().queryForList("select unit_id from account_link_unit where link_id = ?", UUID.class, link);
        }
    }

    static MockHttpServletRequestBuilder transfer(String email, String confirmation, String token, UUID... keep) {
        String units = keep.length == 0 ? "" : ",\"keepUnitIds\":[" + java.util.Arrays.stream(keep).map(u -> "\"" + u + "\"").collect(java.util.stream.Collectors.joining(",")) + "]";
        var request = MockMvcRequestBuilders.post("/api/v1/organization/coordination-transfer").contentType("application/json")
                .content("{\"email\":\"" + email + "\",\"confirmation\":\"" + confirmation + "\"" + units + "}");
        return token == null ? request : request.header("X-Reauth-Token", token);
    }

    MockHttpServletResponse send(Member from, String email, String confirmation, String token, UUID... keep) throws Exception {
        return call(transfer(email, confirmation, token, keep), from.principal()).getResponse();
    }

    int emails(String to) {
        return adminJdbc().queryForObject("select count(*) from email_message where template = 'COORDINATION_TRANSFERRED' and to_email = ?",
                Integer.class, to);
    }

    int audits(Tenant t) {
        return audit(t).size();
    }

    List<java.util.Map<String, Object>> audit(Tenant t) {
        return adminJdbc().queryForList("select actor_profile, before_data::text as b, after_data::text as a from audit_log "
                + "where organization_id = ? and action = 'organization.coordination_transferred'", t.orgId());
    }

    /** Nada mudou: perfis, e-mail e auditoria. */
    void untouched(Member coordinator, Member admin) {
        assertThat(coordinator.role()).isEqualTo("COORDINATOR");
        assertThat(admin.role()).isEqualTo("ADMINISTRATOR");
        assertThat(emails(admin.email)).isZero();
        assertThat(audits(coordinator.tenant)).isZero();
    }
}
