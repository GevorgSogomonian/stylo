package com.example.stylo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.example.stylo.entity.CustomOAuth2User;
import com.example.stylo.entity.User;
import com.example.stylo.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class CustomOAuth2UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Spy
    @InjectMocks
    private CustomOAuth2UserService customOAuth2UserService;

    private OidcUserRequest oidcUserRequest;
    private OidcUser oidcUser;

    @BeforeEach
    void setUp() {
        ClientRegistration clientRegistration = ClientRegistration.withRegistrationId("google")
            .clientId("test-client-id")
            .clientSecret("test-client-secret")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .scope("openid", "profile", "email")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://www.googleapis.com/oauth2/v4/token")
            .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
            .userNameAttributeName("sub")
            .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .build();
        
        OidcIdToken idToken = OidcIdToken.withTokenValue("test-token")
            .claim("sub", "12345")
            .claim("email", "test@example.com")
            .claim("name", "Test User")
            .claim("picture", "http://example.com/picture.jpg")
            .build();
        
        oidcUser = new DefaultOidcUser(
            Collections.emptyList(), 
            idToken, 
            "sub"
        );
        
        OAuth2AccessToken accessToken = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "test-token", Instant.now(), Instant.now().plusSeconds(60));

        oidcUserRequest = new OidcUserRequest(clientRegistration, accessToken, idToken, null);
    }

    @Test
    void whenNewUserLogsIn_thenCreateNewUser() {
        // given
        when(userRepository.findByOauthProviderAndOauthProviderId("google", "12345"))
            .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L); // Simulate saving and getting an ID
            return user;
        });
        
        doReturn(oidcUser).when(customOAuth2UserService).loadOidcUser(oidcUserRequest);

        // when
        OidcUser result = customOAuth2UserService.loadUser(oidcUserRequest);

        // then
        assertNotNull(result);
        assertEquals(CustomOAuth2User.class, result.getClass());

        CustomOAuth2User customOAuth2User = (CustomOAuth2User) result;
        assertEquals("test@example.com", customOAuth2User.getUser().getEmail());
        assertEquals("Test User", customOAuth2User.getUser().getName());

        verify(userRepository).save(any(User.class));
    }
    
    @Test
    void whenExistingUserLogsIn_thenDoNotCreateNewUser() {
        // given
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setEmail("test@example.com");
        existingUser.setName("Test User");
        existingUser.setOauthProvider("google");
        existingUser.setOauthProviderId("12345");
        
        when(userRepository.findByOauthProviderAndOauthProviderId("google", "12345"))
            .thenReturn(Optional.of(existingUser));
        
        doReturn(oidcUser).when(customOAuth2UserService).loadOidcUser(oidcUserRequest);
        
        // when
        OidcUser result = customOAuth2UserService.loadUser(oidcUserRequest);

        // then
        assertNotNull(result);
        assertEquals(CustomOAuth2User.class, result.getClass());

        CustomOAuth2User customOAuth2User = (CustomOAuth2User) result;
        assertEquals("test@example.com", customOAuth2User.getUser().getEmail());
        assertEquals(existingUser.getId(), customOAuth2User.getUser().getId());
        verify(userRepository, never()).save(any(User.class));
    }
}
