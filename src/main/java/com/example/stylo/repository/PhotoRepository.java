package com.example.stylo.repository;

import com.example.stylo.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.stylo.entity.User;
import com.example.stylo.entity.Space;
import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByUser(User user);
    List<Photo> findByUserAndCategory(User user, String category);
    List<Photo> findBySpace(Space space);
    List<Photo> findBySpaceAndCategory(Space space, String category);
    void deleteBySpace(Space space);
}
