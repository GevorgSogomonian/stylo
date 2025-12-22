package com.example.stylo.controller;

import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.Photo;
import com.example.stylo.entity.User;
import com.example.stylo.entity.WorkspaceItem;
import com.example.stylo.repository.PhotoRepository;
import com.example.stylo.repository.WorkspaceItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceItemRepository workspaceItemRepository;
    private final PhotoRepository photoRepository;
    private final com.example.stylo.repository.SpaceRepository spaceRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWorkspace(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId) {
        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);
        
        List<WorkspaceItem> items = workspaceItemRepository.findBySpace(space);
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("items", items);
        response.put("selectedMannequin", space.getSelectedMannequin());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<List<WorkspaceItem>> saveWorkspace(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId,
            @RequestBody Map<String, Object> payload) {
        
        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);
        
        // Сохраняем манекен если он пришел
        if (payload.containsKey("mannequinId")) {
            Object mIdObj = payload.get("mannequinId");
            if (mIdObj != null) {
                Long mannequinId = Long.valueOf(mIdObj.toString());
                Photo mannequin = photoRepository.findById(mannequinId).orElse(null);
                space.setSelectedMannequin(mannequin);
                spaceRepository.save(space);
            } else {
                space.setSelectedMannequin(null);
                spaceRepository.save(space);
            }
        }

        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        
        // Очищаем старое состояние холста
        workspaceItemRepository.deleteBySpace(space);
        
        if (items == null) return ResponseEntity.ok(List.of());

        // Сохраняем новое
        List<WorkspaceItem> newItems = items.stream().map(data -> {
            Long photoId = Long.valueOf(data.get("serverPhotoId").toString());
            Photo photo = photoRepository.findById(photoId)
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Photo not found"));
            
            if (!photo.getUser().getId().equals(user.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied to photo: " + photoId);
            }
            
            return WorkspaceItem.builder()
                    .user(user)
                    .space(space)
                    .photo(photo)
                    .x(Double.valueOf(data.get("x").toString()).intValue())
                    .y(Double.valueOf(data.get("y").toString()).intValue())
                    .width(Double.valueOf(data.get("width").toString()).intValue())
                    .height(Double.valueOf(data.get("height").toString()).intValue())
                    .rotation(data.get("rotation") != null ? Double.valueOf(data.get("rotation").toString()).intValue() : 0)
                    .build();
        }).toList();
        
        return ResponseEntity.ok(workspaceItemRepository.saveAll(newItems));
    }

    private User getUserFromPrincipal(Object principal) {
        if (principal instanceof CustomOAuth2User customUser) {
            return customUser.getUser();
        } else if (principal instanceof User user) {
            return user;
        }
        throw new RuntimeException("Unauthorized");
    }

    private com.example.stylo.entity.Space getSpace(User user, Long spaceId) {
        if (spaceId == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "X-Space-Id header is missing");
        }
        com.example.stylo.entity.Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Space not found"));
        if (!space.getUser().getId().equals(user.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        }
        return space;
    }
}
