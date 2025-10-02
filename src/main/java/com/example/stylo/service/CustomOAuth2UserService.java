package com.example.stylo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.example.stylo.entity.User;
import com.example.stylo.repository.UserRepository;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  @Autowired
  private UserRepository userRepository;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oauth2User = super.loadUser(userRequest);

    String email = oauth2User.getAttribute("email");
    String name = oauth2User.getAttribute("name");
    String pictureUrl = oauth2User.getAttribute("picture");
    String providerId = oauth2User.getAttribute("sub");
    String provider = userRequest.getClientRegistration().getRegistrationId();

    // Проверяем, существует ли пользователь
    User user = userRepository
        .findByOauthProviderAndOauthProviderId(provider, providerId)
        .orElseGet(() -> {
          User newUser = new User();
          newUser.setEmail(email);
          newUser.setName(name);
          newUser.setPictureUrl(pictureUrl);
          newUser.setOauthProvider(provider);
          newUser.setOauthProviderId(providerId);
          return userRepository.save(newUser);
        });

    return oauth2User;
  }
}
