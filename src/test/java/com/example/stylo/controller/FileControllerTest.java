package com.example.stylo.controller;

import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.example.stylo.repository.PhotoRepository;
import com.example.stylo.service.ImageProcessingService;
import com.example.stylo.service.MinioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;


import java.io.ByteArrayInputStream;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;


@WebMvcTest(FileController.class)
public class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MinioService minioService;

    @MockBean
    private ImageProcessingService imageProcessingService;

    @MockBean
    private PhotoRepository photoRepository;

    private User user;

    @BeforeEach
    public void setup() {
        user = new User();
        user.setId(1L);

        OidcIdToken idToken = OidcIdToken.withTokenValue("test-token")
                .claim("sub", "12345")
                .build();
        OidcUser oidcUser = new DefaultOidcUser(Collections.emptyList(), idToken);

        CustomOAuth2User customOAuth2User = new CustomOAuth2User(oidcUser, user);
        OAuth2AuthenticationToken authentication = new OAuth2AuthenticationToken(
                customOAuth2User,
                Collections.emptyList(),
                "google");

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    public void testUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "test image".getBytes());

        when(imageProcessingService.processUserImage(any())).thenReturn("processed image".getBytes());
        when(minioService.uploadImage(any(), eq("test.jpg"), any(User.class), eq("test-category"))).thenReturn("new-object-name");

        mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .param("category", "test-category")
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("new-object-name"));
    }

    @Test
    public void testDownload() throws Exception {
        when(minioService.downloadImage("test-object-name")).thenReturn(new ByteArrayInputStream("test data".getBytes()));
        when(minioService.getContentType("test-object-name")).thenReturn(MediaType.IMAGE_JPEG_VALUE);

        mockMvc.perform(get("/api/files/test-object-name"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_JPEG_VALUE))
                .andExpect(header().string("Content-Disposition", "inline; filename*=UTF-8''test-object-name"));
    }

    @Test
    public void testGetPhotosByCategory() throws Exception {
        Photo photo = new Photo();
        photo.setId(1L);
        photo.setFilename("test-photo.jpg");
        photo.setCategory("test-category");
        List<Photo> photos = Collections.singletonList(photo);

        when(photoRepository.findByUserAndCategory(user, "test-category")).thenReturn(photos);

        mockMvc.perform(get("/api/files/category/test-category"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].filename", is("test-photo.jpg")));
    }
}