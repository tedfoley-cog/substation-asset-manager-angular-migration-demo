package com.meridian.sam.web;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.service.UserService;
import com.meridian.sam.web.dto.CurrentUserDto;
import com.meridian.sam.web.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Users")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }

    @GetMapping("/users")
    @Operation(summary = "Operator accounts and roles")
    public List<UserDto> list() { return service.list().stream().map(DtoMapper::user).toList(); }

    @GetMapping("/me")
    @Operation(summary = "Identity and permissions resolved from the trusted X-SAM-User header")
    public CurrentUserDto me(CurrentUser user) { return DtoMapper.currentUser(user); }
}
