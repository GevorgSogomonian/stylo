package com.example.stylo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.slf4j.Slf4j;

/**
 * MVC controller for public pages (index, login) and the authenticated home
 * page.
 */
@Slf4j
@Controller
public class HomeController {

  /**
   * Render the public index page.
   *
   * @return the name of the index view template
   */
  @GetMapping("/")
  public String index() {
    return "index";
  }

  /**
   * Render the custom login page used for OAuth2 authentication.
   *
   * @return the name of the login view template
   */
  @GetMapping("/login")
  public String login() {
    log.info("login");
    return "login";
  }

  /**
   * Render the authenticated user's home page and populate the model with basic
   * profile info.
   *
   * @param principal the authenticated OAuth2 user (injected)
   * @param model     the Spring MVC Model used to pass attributes to the view
   * @return the name of the home view template
   */
  @GetMapping("/home")
  public String home(@AuthenticationPrincipal OAuth2User principal, Model model) {
    model.addAttribute("name", principal.getAttribute("name"));
    model.addAttribute("email", principal.getAttribute("email"));
    model.addAttribute("picture", principal.getAttribute("picture"));
    return "home";
  }
}
