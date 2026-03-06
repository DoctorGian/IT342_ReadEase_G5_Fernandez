package edu.cit.fernandez.readease.controller;

import edu.cit.fernandez.readease.dto.AuthResponse;
import edu.cit.fernandez.readease.dto.LoginRequest;
import edu.cit.fernandez.readease.dto.RegisterRequest;
import edu.cit.fernandez.readease.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            AuthResponse response = new AuthResponse(
                "User registered successfully",
                null,
                true
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse(
                e.getMessage(),
                null,
                false
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@RequestBody LoginRequest request) {
        try {
            AuthService.LoginResponse loginResponse = authService.login(request);
            AuthResponse response = new AuthResponse(
                "Login successful",
                loginResponse.getToken(),
                true,
                loginResponse.getUser()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse(
                e.getMessage(),
                null,
                false
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logoutUser(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                AuthResponse response = new AuthResponse(
                    "No token provided",
                    null,
                    false
                );
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Extract token from "Bearer" prefix if present
            String actualToken = token.startsWith("Bearer ") ? token.substring(7) : token;

            boolean isValid = authService.validateToken(actualToken);
            if (!isValid) {
                AuthResponse response = new AuthResponse(
                    "Invalid token",
                    null,
                    false
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            AuthResponse response = new AuthResponse(
                "User logged out successfully",
                null,
                true
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse(
                e.getMessage(),
                null,
                false
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateToken(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                AuthResponse response = new AuthResponse(
                    "No token provided",
                    null,
                    false
                );
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Extract token from "Bearer" prefix if present
            String actualToken = token.startsWith("Bearer ") ? token.substring(7) : token;

            boolean isValid = authService.validateToken(actualToken);
            if (!isValid) {
                AuthResponse response = new AuthResponse(
                    "Invalid token",
                    null,
                    false
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            AuthResponse response = new AuthResponse(
                "Token is valid",
                null,
                true
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse(
                e.getMessage(),
                null,
                false
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
