package com.example.stylo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.stylo.entity.User;

/**
 * Repository for User entities.
 * Provides lookup methods used during OAuth2 user provisioning and general user queries.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
/**
   * Find a user by their email address.
   *
   * @param email the email to search for
   * @return an Optional containing the User if found, otherwise empty
   */
  Optional<User> findByEmail(String email);

/**
   * Find a user by OAuth provider and provider-specific id.
   * Used to match returning users after OAuth2 authentication.
   *
   * @param provider the OAuth provider registration id (eg. "google")
   * @param providerId the provider-specific subject id
   * @return an Optional containing the User if found, otherwise empty
   */
  Optional<User> findByOauthProviderAndOauthProviderId(String provider, String providerId);
}
