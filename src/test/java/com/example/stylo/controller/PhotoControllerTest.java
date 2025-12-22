package com.example.stylo.controller;

import com.example.stylo.TestUtils;
import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.example.stylo.repository.PhotoRepository;
import com.example.stylo.repository.UserRepository;
import com.example.stylo.service.ImageProcessingService;
import com.example.stylo.service.JwtService;
import com.example.stylo.service.MinioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;


import java.io.ByteArrayInputStream;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PhotoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MinioService minioService;

    @MockBean
    private ImageProcessingService imageProcessingService;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.example.stylo.repository.SpaceRepository spaceRepository;

    private User user;
    private String token;
    private com.example.stylo.entity.Space space;

    @BeforeEach
    public void setup() {
        photoRepository.deleteAll();
        spaceRepository.deleteAll();
        userRepository.deleteAll();
        user = new User();
        user.setEmail("test@example.com");
        user = userRepository.save(user);
        
        space = com.example.stylo.entity.Space.builder()
                .name("Test Space")
                .user(user)
                .build();
        space = spaceRepository.save(space);

        token = TestUtils.generateToken(user, jwtService);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    @Test
    public void testUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "test image".getBytes());

        Photo photoFromMinio = new Photo();
        photoFromMinio.setFilename("new-object-name");
        photoFromMinio.setCategory("test-category");
        photoFromMinio.setUser(user);
        photoFromMinio.setSpace(space);

        when(imageProcessingService.processUserImage(any())).thenReturn("processed image".getBytes());
        when(minioService.uploadImage(any(), eq("test.jpg"), any(User.class), eq("test-category"))).thenReturn(photoFromMinio);

        mockMvc.perform(multipart("/api/photos")
                        .file(file)
                        .param("category", "test-category")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Space-Id", space.getId())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.filename", is("new-object-name")));
    }

    @Test
    public void testDownload() throws Exception {
        Photo photo = new Photo();
        photo.setFilename("test-object-name");
        photo.setCategory("test-category");
        photo.setUser(user);
        photo.setSpace(space);
        photo = photoRepository.save(photo);

        when(minioService.downloadImage("test-object-name")).thenReturn(new ByteArrayInputStream("test data".getBytes()));
        when(minioService.getContentType("test-object-name")).thenReturn(MediaType.IMAGE_JPEG_VALUE);

        mockMvc.perform(get("/api/photos/" + photo.getId() + "/raw")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_JPEG_VALUE))
                .andExpect(header().string("Content-Disposition", "inline; filename*=UTF-8''test-object-name"));
    }

    @Test
    public void testGetPhotosByCategory() throws Exception {
        Photo photo = new Photo();
        photo.setFilename("test-photo.jpg");
        photo.setCategory("test-category");
        photo.setUser(user);
        photo.setSpace(space);
        photoRepository.save(photo);

        mockMvc.perform(get("/api/photos")
                        .param("category", "test-category")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Space-Id", space.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].filename", is("test-photo.jpg")));
    }

    @Test
    public void testDeletePhoto() throws Exception {
        Photo photo = new Photo();
        photo.setFilename("test-photo.jpg");
        photo.setCategory("test-category");
        photo.setUser(user);
        photo = photoRepository.save(photo);

        mockMvc.perform(delete("/api/photos/" + photo.getId())
                        .header("Authorization", "Bearer " + token)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("Photo deleted successfully."));
    }

    @Test
    public void testDeletePhoto_unauthorized() throws Exception {
        User anotherUser = new User();
        anotherUser.setEmail("another@test.com");
        anotherUser = userRepository.save(anotherUser);

        Photo photo = new Photo();
        photo.setFilename("test-photo.jpg");
        photo.setCategory("test-category");
        photo.setUser(anotherUser);
        photo = photoRepository.save(photo);

        mockMvc.perform(delete("/api/photos/" + photo.getId())
                        .header("Authorization", "Bearer " + token)
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }
}
