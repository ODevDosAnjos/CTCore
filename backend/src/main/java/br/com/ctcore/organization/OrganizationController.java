package br.com.ctcore.organization;

import br.com.ctcore.api.error.ApiValidationException;
import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.organization.OrganizationProfile.OrganizationView;
import br.com.ctcore.permission.Access;
import br.com.ctcore.permission.Permission;
import br.com.ctcore.permission.Permissions;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** RF-ORG-01 (D1): sem identificador na URL; a organização é a do vínculo ativo da sessão. */
@RestController
@RequestMapping("/api/v1/organization")
class OrganizationController {
    record UpdateRequest(String name, String holderDocument, OrganizationRules.Request rules) {}

    record TransferRequest(String email, String confirmation, List<UUID> keepUnitIds) {}

    record SeatPrice(int adminSeatCents) {}

    private final OrganizationProfile profile;
    private final CoordinationTransfer transfer;

    private final Permissions permissions;
    private final int adminSeatCents;

    OrganizationController(OrganizationProfile profile, CoordinationTransfer transfer, Permissions permissions,
            @Value("${ctcore.billing.admin-seat-cents:5000}") int adminSeatCents) {
        this.profile = profile;
        this.transfer = transfer;
        this.permissions = permissions;
        this.adminSeatCents = adminSeatCents;
    }

    @GetMapping
    OrganizationView read(@AuthenticationPrincipal AccountPrincipal who) {
        return profile.read(who);
    }

    @PatchMapping
    OrganizationView update(@AuthenticationPrincipal AccountPrincipal who, @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestBody UpdateRequest body, HttpServletRequest request) {
        return profile.update(who, ifMatch, body.name(), body.holderDocument(), body.rules(), request.getRemoteAddr());
    }

    @PutMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    OrganizationView replaceLogo(@AuthenticationPrincipal AccountPrincipal who, @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest request) throws IOException {
        if (file == null) throw new ApiValidationException("file", "obrigatório");
        return profile.replaceLogo(who, file.getBytes(), request.getRemoteAddr());
    }

    @DeleteMapping("/logo")
    OrganizationView removeLogo(@AuthenticationPrincipal AccountPrincipal who, HttpServletRequest request) {
        return profile.removeLogo(who, request.getRemoteAddr());
    }

    // RF-ORG-06
    @PostMapping("/coordination-transfer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void transferCoordination(@AuthenticationPrincipal AccountPrincipal who, @RequestBody TransferRequest body,
            @RequestHeader(value = "X-Reauth-Token", required = false) String token, HttpServletRequest request) {
        transfer.transfer(who, body.email(), body.confirmation(), body.keepUnitIds(), token, request.getRemoteAddr());
    }

    // RN-ASS-21 (D3): valor da vaga de Administrador, só para o Coordenador
    @GetMapping("/admin-seat-price")
    SeatPrice adminSeatPrice(@AuthenticationPrincipal AccountPrincipal who) {
        if (permissions.grant(who, Permission.ORGANIZATION_SETTINGS, null) != Access.FULL) throw new AccessDeniedException("Permission denied");
        return new SeatPrice(adminSeatCents);
    }
}
