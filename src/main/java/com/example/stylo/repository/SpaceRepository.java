package com.example.stylo.repository;

import com.example.stylo.entity.Space;
import com.example.stylo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findByUser(User user);
}
