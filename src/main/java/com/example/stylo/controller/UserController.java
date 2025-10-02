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

@RestController
@RequestMapping("/api")
public class UserController {

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

  @GetMapping("/protected")
  public ResponseEntity<String> protectedEndpoint() {
    return ResponseEntity.ok("This is a protected endpoint");
  }
}
