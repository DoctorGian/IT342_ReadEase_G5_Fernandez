package edu.cit.fernandez.readease.service;

import edu.cit.fernandez.readease.dto.LoginRequest;
import edu.cit.fernandez.readease.dto.RegisterRequest;
import edu.cit.fernandez.readease.dto.UserResponse;
import edu.cit.fernandez.readease.entity.User;
import edu.cit.fernandez.readease.repository.UserRepository;
import edu.cit.fernandez.readease.util.TokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenProvider tokenProvider;

    public User register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with email " + request.getEmail() + " already exists");
        }

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Save user to database
        return userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        // Find user by email
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userOptional.get();

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Generate token
        String token = tokenProvider.generateToken(user);
        
        // Create user response
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setName(user.getName());
        userResponse.setEmail(user.getEmail());

        return new LoginResponse(token, userResponse);
    }

    public boolean validateToken(String token) {
        return tokenProvider.validateToken(token);
    }

    public String getEmailFromToken(String token) {
        return tokenProvider.getEmailFromToken(token);
    }

    public static class LoginResponse {
        public String token;
        public UserResponse user;

        public LoginResponse(String token, UserResponse user) {
            this.token = token;
            this.user = user;
        }

        public String getToken() {
            return token;
        }

        public UserResponse getUser() {
            return user;
        }
    }
}
