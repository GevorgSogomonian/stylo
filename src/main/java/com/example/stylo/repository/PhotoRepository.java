package com.example.stylo.repository;

import com.example.stylo.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.stylo.entity.User;
import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByUserAndCategory(User user, String category);
}
