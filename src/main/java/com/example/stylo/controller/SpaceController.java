package com.example.stylo.controller;

import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.Space;
import com.example.stylo.entity.User;
import com.example.stylo.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceRepository spaceRepository;
    private final com.example.stylo.repository.PhotoRepository photoRepository;
    private final com.example.stylo.repository.SavedStateRepository savedStateRepository;
    private final com.example.stylo.repository.WorkspaceItemRepository workspaceItemRepository;

    @GetMapping
    public List<Space> getSpaces(@AuthenticationPrincipal Object principal) {
        return spaceRepository.findByUser(getUserFromPrincipal(principal));
    }

    @PostMapping
    public Space createSpace(@AuthenticationPrincipal Object principal, @RequestParam String name) {
        User user = getUserFromPrincipal(principal);
        Space space = Space.builder()
                .name(name)
                .user(user)
                .build();
        return spaceRepository.save(space);
    }

    @PutMapping("/{id}")
    public Space renameSpace(@AuthenticationPrincipal Object principal, @PathVariable Long id, @RequestParam String name) {
        User user = getUserFromPrincipal(principal);
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Space not found"));
        
        if (!space.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        
        space.setName(name);
        return spaceRepository.save(space);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteSpace(@AuthenticationPrincipal Object principal, @PathVariable Long id) {
        User user = getUserFromPrincipal(principal);
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Space not found"));
        
        if (!space.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        
        // Manual cleanup
        workspaceItemRepository.deleteBySpace(space);
        savedStateRepository.deleteBySpace(space);
        photoRepository.deleteBySpace(space);
        
        spaceRepository.delete(space);
    }

    private User getUserFromPrincipal(Object principal) {
        if (principal instanceof CustomOAuth2User customUser) return customUser.getUser();
        if (principal instanceof User user) return user;
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }
}
