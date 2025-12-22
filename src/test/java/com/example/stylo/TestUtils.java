package com.example.stylo;

import com.example.stylo.entity.User;
import com.example.stylo.service.JwtService;

public class TestUtils {

    public static String generateToken(User user, JwtService jwtService) {
        return jwtService.generateToken(user);
    }
}
