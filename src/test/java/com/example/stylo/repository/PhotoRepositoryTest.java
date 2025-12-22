package com.example.stylo.repository;

import com.example.stylo.entity.Photo;
import com.example.stylo.entity.Space;
import com.example.stylo.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest
public class PhotoRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PhotoRepository photoRepository;

    @Test
    public void whenFindByUserAndCategory_thenReturnPhotos() {
        // given
        User user1 = new User();
        user1.setEmail("user1@test.com");
        entityManager.persist(user1);

        User user2 = new User();
        user2.setEmail("user2@test.com");
        entityManager.persist(user2);

        Photo photo1 = new Photo();
        photo1.setFilename("photo1.jpg");
        photo1.setUser(user1);
        photo1.setCategory("test-category");
        entityManager.persist(photo1);

        Photo photo2 = new Photo();
        photo2.setFilename("photo2.jpg");
        photo2.setUser(user1);
        photo2.setCategory("test-category");
        entityManager.persist(photo2);

        Photo photo3 = new Photo();
        photo3.setFilename("photo3.jpg");
        photo3.setUser(user2);
        photo3.setCategory("test-category");
        entityManager.persist(photo3);

        entityManager.flush();

        // when
        List<Photo> foundPhotos = photoRepository.findByUserAndCategory(user1, "test-category");

        // then
        assertNotNull(foundPhotos);
        assertEquals(2, foundPhotos.size());
    }

    @Test
    public void whenFindBySpace_thenReturnPhotos() {
        // given
        User user = new User();
        user.setEmail("test@test.com");
        entityManager.persist(user);

        Space space1 = Space.builder().name("Space 1").user(user).build();
        entityManager.persist(space1);

        Space space2 = Space.builder().name("Space 2").user(user).build();
        entityManager.persist(space2);

        Photo photo1 = new Photo();
        photo1.setFilename("p1.jpg");
        photo1.setUser(user);
        photo1.setCategory("cat");
        photo1.setSpace(space1);
        entityManager.persist(photo1);

        Photo photo2 = new Photo();
        photo2.setFilename("p2.jpg");
        photo2.setUser(user);
        photo2.setCategory("cat");
        photo2.setSpace(space2);
        entityManager.persist(photo2);

        entityManager.flush();

        // when
        List<Photo> found = photoRepository.findBySpace(space1);

        // then
        assertEquals(1, found.size());
        assertEquals(photo1.getFilename(), found.get(0).getFilename());
    }
}
