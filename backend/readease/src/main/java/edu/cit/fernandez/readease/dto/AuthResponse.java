package edu.cit.fernandez.readease.dto;

public class AuthResponse {
    private String message;
    private String token;
    private boolean success;
    private UserResponse user;

    public AuthResponse() {}

    public AuthResponse(String message, String token, boolean success) {
        this.message = message;
        this.token = token;
        this.success = success;
    }

    public AuthResponse(String message, String token, boolean success, UserResponse user) {
        this.message = message;
        this.token = token;
        this.success = success;
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public String getToken() {
        return token;
    }

    public boolean isSuccess() {
        return success;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }
}