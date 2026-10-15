package com.meridian.sam.auth;

import com.meridian.sam.domain.Role;

/** Resolved identity for the current request. Anonymous requests resolve to a VIEWER named "anonymous". */
public record CurrentUser(String username, String displayName, Role role, String locale, boolean authenticated) {
    public static CurrentUser anonymous() {
        return new CurrentUser("anonymous", "Anonymous", Role.VIEWER, "en-GB", false);
    }
}
