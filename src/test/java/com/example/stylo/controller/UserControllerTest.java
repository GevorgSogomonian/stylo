package com.example.stylo.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.web.servlet.MockMvc;
import static org.hamcrest.Matchers.is;


import com.example.stylo.service.CustomOAuth2UserService;

@WebMvcTest(UserController.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    private OAuth2User oAuth2User;

    @BeforeEach
    public void setup() {
        oAuth2User = new DefaultOAuth2User(
                Collections.emptyList(),
                Collections.singletonMap("name", "Test User"),
                "name");

        OAuth2AuthenticationToken authentication = new OAuth2AuthenticationToken(
                oAuth2User,
                Collections.emptyList(),
                "google");

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    public void testGetUser() throws Exception {
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test User")));
    }

    @Test
    public void testProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/protected"))
                .andExpect(status().isOk())
                .andExpect(content().string("This is a protected endpoint"));
    }
}
