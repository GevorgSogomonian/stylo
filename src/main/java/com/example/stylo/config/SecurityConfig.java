package com.example.stylo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import com.example.stylo.service.CustomOAuth2UserService;

@Configuration

/**
 * Security configuration for the application.
 * - Disables CSRF for API endpoints under /api/**
 * - Configures OAuth2 login with a custom OIDC user service and a custom login
 * page (/login)
 */
@EnableWebSecurity
public class SecurityConfig {

  @Autowired
  private CustomOAuth2UserService customOAuth2UserService;

  /**
   * Configure HTTP security for the application.
   *
   * - Disables CSRF for /api/** to allow API clients to POST without CSRF tokens
   * (review for security needs).
   * - Allows unauthenticated access to /, /login and /error.
   * - Protects all other endpoints and configures OAuth2 login.
   *
   * @param http the HttpSecurity builder
   * @return the built SecurityFilterChain
   * @throws Exception on configuration errors
   */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf
            .ignoringRequestMatchers(new AntPathRequestMatcher("/api/**")))
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/", "/login", "/error", "/fivicon.ico").permitAll()
            .anyRequest().authenticated())
        .oauth2Login(oauth2 -> oauth2
            .loginPage("/login")
            .defaultSuccessUrl("/home", true)
            .userInfoEndpoint(userInfo -> userInfo
                .oidcUserService(customOAuth2UserService)))
        .logout(logout -> logout
            .logoutSuccessUrl("/")
            .permitAll());

    return http.build();
  }
}
