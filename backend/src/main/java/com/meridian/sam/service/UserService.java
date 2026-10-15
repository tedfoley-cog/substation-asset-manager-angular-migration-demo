package com.meridian.sam.service;

import com.meridian.sam.domain.AppUser;
import com.meridian.sam.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {
    private final AppUserRepository users;
    public UserService(AppUserRepository users) { this.users = users; }
    public List<AppUser> list() { return users.findAllByOrderByUsernameAsc(); }
}
