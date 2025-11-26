package com.example.stylo.entity;

import java.util.Collection;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/**
 * Wrapper around OidcUser that holds a reference to the persisted local User entity.
 * Returned by CustomOAuth2UserService after successful OIDC login so controllers can access both
 * OIDC attributes and application-level user data.
 */
public class CustomOAuth2User implements OidcUser {

  private final OidcUser delegate;
  private final User user;

  public CustomOAuth2User(OidcUser delegate, User user) {
    this.delegate = delegate;
    this.user = user;
  }

  @Override
  public Map<String, Object> getAttributes() {
    return delegate.getAttributes();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return delegate.getAuthorities();
  }

  @Override
  public String getName() {
    return delegate.getName();
  }

  @Override
  public Map<String, Object> getClaims() {
    return delegate.getClaims();
  }

  @Override
  public OidcUserInfo getUserInfo() {
    return delegate.getUserInfo();
  }

  @Override
  public OidcIdToken getIdToken() {
    return delegate.getIdToken();
  }

  /**
   * Return the local persisted User associated with this OIDC principal.
   *
   * @return the application User entity
   */
  public User getUser() {
    return user;
  }
}
