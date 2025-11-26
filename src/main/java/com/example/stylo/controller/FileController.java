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
import com.example.stylo.service.ImageProcessingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
/**
 * REST controller for file operations (uploads/downloads).
 * Endpoints are under /api/files and require an authenticated user.
 */
@RequiredArgsConstructor
public class FileController {

  private final ImageService imageService;
  private final ImageProcessingService imageProcessingService;

  /**
   * Handle multipart file upload and store the file in MinIO.
   * Requires an authenticated OAuth2 principal.
   *
   * @param principal the authenticated OAuth2 user (injected)
   * @param file the uploaded multipart file
   * @return ResponseEntity containing the stored object name on success
   * @throws Exception on MinIO or IO errors
   */
  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> upload(
      @AuthenticationPrincipal OAuth2User principal,
      @RequestParam("file") MultipartFile file) throws Exception {

    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "User not authenticated");
    }

    // Read incoming bytes, process (convert/resize/remove background), then store
    byte[] raw = file.getBytes();
    byte[] processed = imageProcessingService.processUserImage(raw);

    String objectName = imageService.uploadImage(processed, file.getOriginalFilename());
    return ResponseEntity.ok(objectName);
  }

  /**
   * Stream an object from MinIO to the HTTP response.
   * Requires an authenticated OAuth2 principal.
   *
   * @param principal the authenticated OAuth2 user (injected)
   * @param objectName the name of the object to download from MinIO
   * @return ResponseEntity streaming the object's InputStreamResource with proper headers
   * @throws Exception on MinIO or IO errors
   */
  @GetMapping(value = "/{objectName}")
  public ResponseEntity<InputStreamResource> download(
      @AuthenticationPrincipal OAuth2User principal,
      @PathVariable String objectName) throws Exception {

    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "User not authenticated");
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
