package com.example.stylo.repository;

import com.example.stylo.entity.SavedState;
import com.example.stylo.entity.Space;
import com.example.stylo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SavedStateRepository extends JpaRepository<SavedState, Long> {
    List<SavedState> findByUser(User user);
    List<SavedState> findBySpace(Space space);
    void deleteBySpace(Space space);
}
