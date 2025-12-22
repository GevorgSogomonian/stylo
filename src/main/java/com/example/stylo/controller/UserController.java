package com.example.stylo.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.example.stylo.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Simple REST controller exposing authenticated user information and a protected test endpoint.
 * Base path: /api
 */
@RestController
@RequestMapping("/api")
public class UserController {

  /**
   * Return a JSON map with the authenticated user's basic profile information.
   *
   * @param principal the authenticated principal (injected)
   * @return a map containing name, email and picture attributes
   * @throws ResponseStatusException 401 if the principal is null (not authenticated)
   */
  @GetMapping("/users/me")
  public Map<String, Object> getUser(@AuthenticationPrincipal Object principal) {
    if (principal == null || principal.equals("anonymousUser")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
    }

    Map<String, Object> userInfo = new HashMap<>();
    if (principal instanceof OAuth2User oauth2User) {
        userInfo.put("name", oauth2User.getAttribute("name"));
        userInfo.put("email", oauth2User.getAttribute("email"));
        userInfo.put("picture", oauth2User.getAttribute("picture"));
    } else if (principal instanceof User user) {
        userInfo.put("name", user.getName());
        userInfo.put("email", user.getEmail());
        userInfo.put("picture", user.getPictureUrl());
    }

    return userInfo;
  }

  @PostMapping("/auth/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, SecurityContextHolder.getContext().getAuthentication());
        return ResponseEntity.ok("Logout successful");
    }

    @GetMapping("/auth/status")
    public Map<String, Boolean> getAuthStatus(@AuthenticationPrincipal Object principal) {
        boolean authenticated = principal != null && !principal.equals("anonymousUser");
        return Collections.singletonMap("authenticated", authenticated);
    }
}
