package com.example.stylo.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.stylo.entity.User;
import com.example.stylo.repository.UserRepository;
import com.example.stylo.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import static org.hamcrest.Matchers.is;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.example.stylo.repository.SpaceRepository spaceRepository;

    private String token;
    private User user;

    @BeforeEach
    public void setup() {
        spaceRepository.deleteAll();
        userRepository.deleteAll();
        user = new User();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user = userRepository.save(user);
        token = jwtService.generateToken(user);
    }

    @Test
    @DirtiesContext
    public void testGetUser() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test User")));
    }

    @Test
    @DirtiesContext
    public void testGetAuthStatus_authenticated() throws Exception {
        mockMvc.perform(get("/api/auth/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated", is(true)));
    }

    @Test
    public void testGetAuthStatus_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated", is(false)));
    }
}