package com.example.stylo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import com.example.stylo.service.CustomOAuth2UserService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Autowired
  private CustomOAuth2UserService customOAuth2UserService;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/", "/login", "/error").permitAll()
            .anyRequest().authenticated())
        .oauth2Login(oauth2 -> oauth2
            .loginPage("/login")
            .defaultSuccessUrl("/home", true)
            .userInfoEndpoint(userInfo -> userInfo
                .userService(customOAuth2UserService)))
        .logout(logout -> logout
            .logoutSuccessUrl("/")
            .permitAll());

    return http.build();
  }
}
