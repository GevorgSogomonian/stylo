package com.example.stylo.controller;

import com.example.stylo.entity.*;
import com.example.stylo.repository.PhotoRepository;
import com.example.stylo.repository.SavedStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-states")
@RequiredArgsConstructor
public class SavedStateController {

    private final SavedStateRepository savedStateRepository;
    private final PhotoRepository photoRepository;
    private final com.example.stylo.repository.SpaceRepository spaceRepository;

    @GetMapping
    public List<SavedState> getStates(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId) {
        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);
        return savedStateRepository.findBySpace(space);
    }

    @PostMapping
    @Transactional
    public SavedState saveState(
            @AuthenticationPrincipal Object principal,
            @RequestHeader(value = "X-Space-Id", required = false) Long spaceId,
            @RequestBody Map<String, Object> payload) {
        User user = getUserFromPrincipal(principal);
        com.example.stylo.entity.Space space = getSpace(user, spaceId);
        
        String name = (String) payload.get("name");
        Long mannequinId = Long.valueOf(payload.get("mannequinId").toString());
        List<Map<String, Object>> itemsData = (List<Map<String, Object>>) payload.get("items");

        Photo mannequin = photoRepository.findById(mannequinId).orElse(null);

        SavedState state = SavedState.builder()
                .user(user)
                .space(space)
                .name(name)
                .mannequin(mannequin)
                .build();

        List<SavedStateItem> items = itemsData.stream().map(data -> {
            Long photoId = Long.valueOf(data.get("serverPhotoId").toString());
            Photo photo = photoRepository.findById(photoId).orElse(null);
            if (photo == null) return null; // Если фото удалено из галереи, пропускаем

            return SavedStateItem.builder()
                    .savedState(state)
                    .photo(photo)
                    .x(Double.valueOf(data.get("x").toString()).intValue())
                    .y(Double.valueOf(data.get("y").toString()).intValue())
                    .width(Double.valueOf(data.get("width").toString()).intValue())
                    .height(Double.valueOf(data.get("height").toString()).intValue())
                    .rotation(data.get("rotation") != null ? Double.valueOf(data.get("rotation").toString()).intValue() : 0)
                    .build();
        }).filter(i -> i != null).toList();

        state.setItems(items);
        return savedStateRepository.save(state);
    }

    @PutMapping("/{id}/content")
    @Transactional
    public SavedState updateStateContent(@AuthenticationPrincipal Object principal, @PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = getUserFromPrincipal(principal);
        SavedState state = savedStateRepository.findById(id).orElseThrow();
        if (!state.getUser().getId().equals(user.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        Long mannequinId = Long.valueOf(payload.get("mannequinId").toString());
        List<Map<String, Object>> itemsData = (List<Map<String, Object>>) payload.get("items");

        state.setMannequin(photoRepository.findById(mannequinId).orElse(null));
        
        // Очищаем старые вещи и добавляем новые
        state.getItems().clear();
        List<SavedStateItem> newItems = itemsData.stream().map(data -> {
            Long photoId = Long.valueOf(data.get("serverPhotoId").toString());
            Photo photo = photoRepository.findById(photoId).orElse(null);
            if (photo == null) return null;
            return SavedStateItem.builder()
                    .savedState(state)
                    .photo(photo)
                    .x(Double.valueOf(data.get("x").toString()).intValue())
                    .y(Double.valueOf(data.get("y").toString()).intValue())
                    .width(Double.valueOf(data.get("width").toString()).intValue())
                    .height(Double.valueOf(data.get("height").toString()).intValue())
                    .rotation(data.get("rotation") != null ? Double.valueOf(data.get("rotation").toString()).intValue() : 0)
                    .build();
        }).filter(i -> i != null).toList();
        
        state.getItems().addAll(newItems);
        return savedStateRepository.save(state);
    }

    @PutMapping("/{id}")
    @Transactional
    public SavedState renameState(@AuthenticationPrincipal Object principal, @PathVariable Long id, @RequestParam String name) {
        SavedState state = savedStateRepository.findById(id).orElseThrow();
        if (!state.getUser().getId().equals(getUserFromPrincipal(principal).getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        state.setName(name);
        return savedStateRepository.save(state);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteState(@AuthenticationPrincipal Object principal, @PathVariable Long id) {
        SavedState state = savedStateRepository.findById(id).orElseThrow();
        if (!state.getUser().getId().equals(getUserFromPrincipal(principal).getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        savedStateRepository.delete(state);
    }

    private User getUserFromPrincipal(Object principal) {
        if (principal instanceof CustomOAuth2User customUser) return customUser.getUser();
        if (principal instanceof User user) return user;
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
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
