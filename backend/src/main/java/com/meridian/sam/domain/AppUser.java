package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "app_user")
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 64)
    private String username;
    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private Role role;
    @Column(nullable = false, length = 16)
    private String locale;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public Role getRole() { return role; }
    public String getLocale() { return locale; }
    public boolean isActive() { return active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
