package br.com.ctcore.identity;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** RF-LGP-01: the data of the session's own account as an attachment; the route takes no id. */
@RestController
@RequestMapping("/api/v1/auth")
class AccountDataExportController {
    private final AccountDataExport export;

    AccountDataExportController(AccountDataExport export) {
        this.export = export;
    }

    @GetMapping("/data-export")
    ResponseEntity<AccountDataExport.File> download(@AuthenticationPrincipal AccountPrincipal who, HttpServletRequest request) {
        AccountDataExport.File file = export.export(who, request.getRemoteAddr());
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("meus-dados-ctcore.json").build().toString())
                .body(file);
    }
}
