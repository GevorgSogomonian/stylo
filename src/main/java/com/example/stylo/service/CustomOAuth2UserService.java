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
@Service
public class CustomOAuth2UserService extends OidcUserService {

  @Autowired
  private UserRepository userRepository;

  @Override
  @Transactional
  public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
    log.info("CustomOAuth2UserService.loadUser invoked for provider={} clientId={}",
        userRequest.getClientRegistration().getRegistrationId(),
        userRequest.getClientRegistration().getClientId());

    OidcUser oidcUser = loadOidcUser(userRequest);

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
      log.info("User not found in database, creating a new one.");
      user = new User();
      user.setEmail(email);
      user.setName(name);
      user.setPictureUrl(pictureUrl);
      user.setOauthProvider(provider);
      user.setOauthProviderId(providerId);
      log.info("Attempting to save new user: {}", user);
      try {
        userRepository.save(user);
        log.info("New user saved successfully with id: {}", user.getId());
      } catch (Exception e) {
        log.error("Error saving user to the database", e);
      }
    } else {
      log.info("User found in database: {}", user);
    }
    return new CustomOAuth2User(oidcUser, user);
  }

  protected OidcUser loadOidcUser(OidcUserRequest userRequest) {
    return super.loadUser(userRequest);
  }
}
