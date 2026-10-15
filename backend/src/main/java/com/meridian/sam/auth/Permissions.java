package com.meridian.sam.auth;

import java.util.function.Predicate;
import com.meridian.sam.domain.Role;

public final class Permissions {
    private Permissions() {}

    public static void require(CurrentUser user, Predicate<Role> check, String action) {
        if (!check.test(user.role())) {
            throw new AccessDeniedException("Role " + user.role() + " may not " + action);
        }
    }
}
