package com.meridian.sam.auth;

import com.meridian.sam.repository.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Trusted-header identity. The reverse proxy in front of the asset web application authenticates the
 * operator (SSO) and forwards the username in {@code X-SAM-User}; this service maps it to a role.
 * Inactive or unknown users are treated as anonymous VIEWERs so read-only screens still work.
 */
@Component
public class CurrentUserResolver {
    private final AppUserRepository users;
    private final AuthProperties props;

    public CurrentUserResolver(AppUserRepository users, AuthProperties props) {
        this.users = users;
        this.props = props;
    }

    public CurrentUser resolve(HttpServletRequest request) {
        String username = request.getHeader(props.header());
        if (username == null || username.isBlank()) {
            username = props.defaultUser();
        }
        if (username == null || username.isBlank()) {
            return CurrentUser.anonymous();
        }
        return users.findByUsername(username.trim())
            .filter(u -> u.isActive())
            .map(u -> new CurrentUser(u.getUsername(), u.getDisplayName(), u.getRole(), u.getLocale(), true))
            .orElse(CurrentUser.anonymous());
    }
}
