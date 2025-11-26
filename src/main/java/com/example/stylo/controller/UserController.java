package com.example.stylo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
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
   * @param principal the authenticated OAuth2 user (injected)
   * @return a map containing name, email and picture attributes
   * @throws ResponseStatusException 401 if the principal is null (not authenticated)
   */
  @GetMapping("/user")
  public Map<String, Object> getUser(@AuthenticationPrincipal OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
    }

    Map<String, Object> userInfo = new HashMap<>();
    userInfo.put("name", principal.getAttribute("name"));
    userInfo.put("email", principal.getAttribute("email"));
    userInfo.put("picture", principal.getAttribute("picture"));

    return userInfo;
  }

  /**
   * Example authenticated-only endpoint that returns a fixed message.
   *
   * @return HTTP 200 with a plain text body when the request is authenticated
   */
  @GetMapping("/protected")
  public ResponseEntity<String> protectedEndpoint() {
    return ResponseEntity.ok("This is a protected endpoint");
  }
}
