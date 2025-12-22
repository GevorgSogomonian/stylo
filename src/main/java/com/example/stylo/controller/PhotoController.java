package com.example.stylo.controller;

import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.example.stylo.repository.PhotoRepository;
import com.example.stylo.service.ImageProcessingService;
import com.example.stylo.service.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final MinioService imageService;
    private final ImageProcessingService imageProcessingService;
    private final PhotoRepository photoRepository;
    private final com.example.stylo.repository.SpaceRepository spaceRepository;

    @Value("${minio.bucketName}")
    private String bucketName;

    /**
     * Upload a new photo.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Photo> upload(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") String category) throws Exception {

        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);

        byte[] raw = file.getBytes();
        byte[] processed = imageProcessingService.processUserImage(raw);

        Photo photo = imageService.uploadImage(processed, file.getOriginalFilename(), user, category);
        photo.setSpace(space);
        return ResponseEntity.ok(photoRepository.save(photo));
    }

    /**
     * Download the raw image content by photo ID.
     */
    @GetMapping(value = "/{id}/raw")
    public ResponseEntity<InputStreamResource> download(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long id) throws Exception {

        User user = getUserFromPrincipal(principal);
        
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found"));

        if (!photo.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to access this photo.");
        }

        InputStream stream = imageService.downloadImage(photo.getFilename());
        String contentType = imageService.getContentType(photo.getFilename());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(
                contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename*=UTF-8''" + URLEncoder.encode(photo.getFilename(), StandardCharsets.UTF_8));

        return new ResponseEntity<>(new InputStreamResource(stream), headers, HttpStatus.OK);
    }

    /**
     * Get user photos, optionally filtered by category.
     */
    @GetMapping
    public ResponseEntity<List<Photo>> getPhotos(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId,
            @RequestParam(value = "category", required = false) String category) {
        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);
        
        List<Photo> photos;
        if (category != null) {
            photos = photoRepository.findBySpaceAndCategory(space, category);
        } else {
            photos = photoRepository.findBySpace(space);
        }
        return ResponseEntity.ok(photos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Photo> updatePhotoCategory(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long id,
            @RequestParam("category") String category) {
        User user = getUserFromPrincipal(principal);

        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found"));

        if (!photo.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to update this photo.");
        }

        photo.setCategory(category);
        Photo updatedPhoto = photoRepository.save(photo);
        return ResponseEntity.ok(updatedPhoto);
    }

    private com.example.stylo.entity.Space getSpace(User user, Long spaceId) {
        if (spaceId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Space-Id header is missing");
        }
        com.example.stylo.entity.Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Space not found"));
        if (!space.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return space;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePhoto(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long id) {
        User user = getUserFromPrincipal(principal);

        Optional<Photo> photoOptional = photoRepository.findById(id);
        if (photoOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Photo photo = photoOptional.get();
        if (!photo.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to delete this photo.");
        }

        try {
            imageService.deleteImage(bucketName, photo.getFilename());
            photoRepository.delete(photo);
            return ResponseEntity.ok("Photo deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting photo.");
        }
    }

    private User getUserFromPrincipal(Object principal) {
        if (principal instanceof CustomOAuth2User customUser) {
            return customUser.getUser();
        } else if (principal instanceof User user) {
            return user;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
    }
}
