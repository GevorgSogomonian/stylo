package com.example.stylo.controller;

import com.example.stylo.TestUtils;
import com.example.stylo.entity.Space;
import com.example.stylo.entity.User;
import com.example.stylo.repository.SpaceRepository;
import com.example.stylo.repository.UserRepository;
import com.example.stylo.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SpaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private User user;
    private String token;

    @BeforeEach
    public void setup() {
        spaceRepository.deleteAll();
        userRepository.deleteAll();
        user = new User();
        user.setEmail("test@example.com");
        user = userRepository.save(user);
        token = TestUtils.generateToken(user, jwtService);
    }

    @Test
    public void testCreateAndGetSpaces() throws Exception {
        mockMvc.perform(post("/api/spaces")
                        .param("name", "My Space")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("My Space")));

        mockMvc.perform(get("/api/spaces")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("My Space")));
    }

    @Test
    public void testDeleteSpace() throws Exception {
        Space space = Space.builder().name("To Delete").user(user).build();
        space = spaceRepository.save(space);

        mockMvc.perform(delete("/api/spaces/" + space.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/spaces")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
