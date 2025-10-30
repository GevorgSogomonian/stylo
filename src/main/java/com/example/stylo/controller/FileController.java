package com.example.stylo.controller;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.stylo.util.image.ImageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final ImageService imageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> upload(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam("file") MultipartFile file) throws Exception {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        String objectName = imageService.uploadImage(file);
        return ResponseEntity.ok(objectName);
    }

    @GetMapping(value = "/{objectName}")
    public ResponseEntity<InputStreamResource> download(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable String objectName) throws Exception {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        InputStream stream = imageService.downloadImage(objectName);
        String contentType = imageService.getContentType(objectName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(
                contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename*=UTF-8''" + URLEncoder.encode(objectName, StandardCharsets.UTF_8));

        return new ResponseEntity<>(new InputStreamResource(stream), headers, HttpStatus.OK);
    }
}
