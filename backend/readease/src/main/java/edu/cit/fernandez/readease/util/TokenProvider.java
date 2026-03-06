package edu.cit.fernandez.readease.util;

import edu.cit.fernandez.readease.entity.User;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple token provider for demonstration purposes.  Generates a hash-based token
 * from the user's email and a timestamp, and retains a map of valid tokens to
 * emails.  In a real application you would use JWT or another secure mechanism.
 */
@Component
public class TokenProvider {
    private final Map<String, String> tokenStore = new ConcurrentHashMap<>();

    public String generateToken(User user) {
        String raw = user.getEmail() + ":" + System.currentTimeMillis();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
            tokenStore.put(token, user.getEmail());
            return token;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Unable to generate token", e);
        }
    }

    public boolean validateToken(String token) {
        return token != null && tokenStore.containsKey(token);
    }

    public String getEmailFromToken(String token) {
        return tokenStore.get(token);
    }
}