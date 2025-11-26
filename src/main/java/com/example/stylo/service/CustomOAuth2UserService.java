package com.example.stylo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.User;
import com.example.stylo.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
/**
 * OIDC user service that provisions a local User entity when a user logs in via OAuth2/OIDC.
 * Delegates to the default OidcUserService to fetch attributes, persists or finds a User record,
 * and returns a CustomOAuth2User that combines the OIDC principal and the persisted User entity.
 */
@Service
public class CustomOAuth2UserService extends OidcUserService {

  @Autowired
  private UserRepository userRepository;

  /**
   * Load the OIDC user and provision or lookup a local User entity.
   *
   * This method delegates to the default OidcUserService to obtain attributes, then
   * checks the database for an existing user matched by provider + providerId. If no
   * user is found a new User is created and persisted.
   *
   * @param userRequest details about the client registration and access token context
   * @return an OidcUser implementation (CustomOAuth2User) that wraps the OIDC principal and the persisted User
   * @throws OAuth2AuthenticationException when OIDC user info cannot be retrieved
   */
  @Override
  @Transactional
  public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
    log.info("CustomOAuth2UserService.loadUser invoked for provider={} clientId={}",
        userRequest.getClientRegistration().getRegistrationId(),
        userRequest.getClientRegistration().getClientId());

    OidcUser oidcUser = super.loadUser(userRequest);

    String email = oidcUser.getAttribute("email");
    String name = oidcUser.getAttribute("name");
    String pictureUrl = oidcUser.getAttribute("picture");
    String providerId = oidcUser.getAttribute("sub");
    String provider = userRequest.getClientRegistration().getRegistrationId();

    if (oidcUser != null && oidcUser.getAttributes() != null) {
      log.info("OAuth2 attributes keys: {}", oidcUser.getAttributes().keySet());
    }

    User user = userRepository
        .findByOauthProviderAndOauthProviderId(provider, providerId)
        .orElse(null);
    if (user == null) {
      user = new User();
      user.setEmail(email);
      user.setName(name);
      user.setPictureUrl(pictureUrl);
      user.setOauthProvider(provider);
      user.setOauthProviderId(providerId);
      userRepository.save(user);
      log.info("new user saved");
    }
    return new CustomOAuth2User(oidcUser, user);
  }
}
