package com.example.stylo.controller;

import com.example.stylo.dto.VirtualTryOnRequest;
import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.example.stylo.repository.PhotoRepository;
import com.example.stylo.service.MannequinDresserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/virtual-try-on")
@RequiredArgsConstructor
public class VirtualTryOnController {

    private final MannequinDresserService mannequinDresserService;
    private final PhotoRepository photoRepository;
    private final com.example.stylo.repository.SpaceRepository spaceRepository;

    @PostMapping
    public ResponseEntity<Photo> processVirtualTryOn(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId,
            @RequestBody VirtualTryOnRequest request) {
        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);

        // 1. Get and verify mannequin photo
        Photo mannequinPhoto = photoRepository.findById(request.getMannequinPhotoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mannequin photo not found"));
        
        if (!mannequinPhoto.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to mannequin photo");
        }

        // 2. Get and verify clothing photos
        List<String> clothingFilenames = new ArrayList<>();
        
        // Handle single clothPhotoId if provided
        if (request.getClothPhotoId() != null) {
            Photo clothPhoto = photoRepository.findById(request.getClothPhotoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clothing photo not found"));
            if (!clothPhoto.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to clothing photo");
            }
            clothingFilenames.add(clothPhoto.getFilename());
        }
        
        // Handle list of clothingPhotoIds if provided
        if (request.getClothingPhotoIds() != null) {
            for (Long id : request.getClothingPhotoIds()) {
                Photo p = photoRepository.findById(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clothing photo not found: " + id));
                if (!p.getUser().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to photo: " + id);
                }
                clothingFilenames.add(p.getFilename());
            }
        }

        if (clothingFilenames.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No clothing items provided");
        }

        // 3. Process
        Photo resultPhoto = mannequinDresserService.processVirtualTryOn(
                mannequinPhoto.getFilename(),
                clothingFilenames,
                user);

        if (resultPhoto == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Processing failed");
        }

        resultPhoto.setSpace(space);
        return ResponseEntity.ok(photoRepository.save(resultPhoto));
    }

    private User getUserFromPrincipal(Object principal) {
        if (principal instanceof CustomOAuth2User customUser) {
            return customUser.getUser();
        } else if (principal instanceof User user) {
            return user;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
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
}
