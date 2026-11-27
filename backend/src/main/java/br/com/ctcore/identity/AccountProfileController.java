package br.com.ctcore.identity;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** RF-ACE-04: profile of the session's own account; no route takes an id. */
@RestController
@RequestMapping("/api/v1/auth/profile")
class AccountProfileController {
    record ProfileRequest(String name, String phone) {}

    private final AccountProfile profile;
    private final SessionService sessions;

    AccountProfileController(AccountProfile profile, SessionService sessions) {
        this.profile = profile;
        this.sessions = sessions;
    }

    private SessionService.SessionView view(AccountPrincipal who) {
        return sessions.view(who.accountId(), who.activeLinkId());
    }

    @PutMapping
    SessionService.SessionView update(@AuthenticationPrincipal AccountPrincipal who, @RequestBody ProfileRequest body,
            HttpServletRequest request) {
        profile.update(who, body.name(), body.phone(), request.getRemoteAddr());
        return view(who);
    }

    @PutMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    SessionService.SessionView replacePhoto(@AuthenticationPrincipal AccountPrincipal who,
            @RequestPart(value = "file", required = false) MultipartFile file, HttpServletRequest request) throws IOException {
        profile.requireAccess(who); // before reading the file
        profile.replacePhoto(who, file == null ? null : file.getBytes(), request.getRemoteAddr());
        return view(who);
    }

    @DeleteMapping("/photo")
    SessionService.SessionView removePhoto(@AuthenticationPrincipal AccountPrincipal who, HttpServletRequest request) {
        profile.removePhoto(who, request.getRemoteAddr());
        return view(who);
    }
}
