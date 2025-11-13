package com.example.stylo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
public class HomeController {

  @GetMapping("/")
  public String index() {
    return "index";
  }

  @GetMapping("/login")
  public String login() {
    log.info("login");
    return "login";
  }

  @GetMapping("/home")
  public String home(@AuthenticationPrincipal OAuth2User principal, Model model) {
    model.addAttribute("name", principal.getAttribute("name"));
    model.addAttribute("email", principal.getAttribute("email"));
    model.addAttribute("picture", principal.getAttribute("picture"));
    return "home";
  }
}
