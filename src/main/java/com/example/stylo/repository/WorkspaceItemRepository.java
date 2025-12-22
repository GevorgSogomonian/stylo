package com.example.stylo.repository;

import com.example.stylo.entity.Space;
import com.example.stylo.entity.User;
import com.example.stylo.entity.WorkspaceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkspaceItemRepository extends JpaRepository<WorkspaceItem, Long> {
    List<WorkspaceItem> findByUser(User user);
    void deleteByUser(User user);
    List<WorkspaceItem> findBySpace(Space space);
    void deleteBySpace(Space space);
}
