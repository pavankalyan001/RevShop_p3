package com.revshop.auth.controller;

import com.revshop.auth.dto.*;
import com.revshop.auth.entity.User;
import com.revshop.auth.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication operations.
 * Handles user registration, login, password reset, and token validation.
 *
 * Owner: Manjula (Login, Registration and Authentication)
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Register a new user.
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /api/auth/register - email: {}, role: {}", request.getEmail(), request.getRole());
        String message = authService.register(request);
        log.info("Registration completed for email: {}", request.getEmail());
        return ResponseEntity.ok(message);
    }

    /**
     * Authenticate user and return JWT token.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login - email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        log.info("Login successful for userId: {}", response.getUserId());
        return ResponseEntity.ok(response);
    }

    /**
     * Initiate password reset process.
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("POST /api/auth/forgot-password - email: {}", request.getEmail());
        String message = authService.forgotPassword(request);
        log.info("Password reset token generated for email: {}", request.getEmail());
        return ResponseEntity.ok(message);
    }

    /**
     * Reset user password with token.
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("POST /api/auth/reset-password - email: {}", request.getEmail());
        String message = authService.resetPassword(request);
        log.info("Password reset completed for email: {}", request.getEmail());
        return ResponseEntity.ok(message);
    }

    /**
     * Validate JWT token (internal endpoint for API Gateway).
     * GET /api/auth/validate
     */
    @GetMapping("/validate")
    public ResponseEntity<UserValidationResponse> validateToken(@RequestHeader("Authorization") String authHeader) {
        log.info("GET /api/auth/validate");
        // Extract token from "Bearer <token>" format
        String token = authHeader.substring(7);
        UserValidationResponse response = authService.validateToken(token);
        log.info("Token validation completed - valid: {}", response.isValid());
        return ResponseEntity.ok(response);
    }

    /**
     * Get user by ID (internal endpoint for other microservices).
     * GET /api/auth/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        log.info("GET /api/auth/user/{}", userId);
        User user = authService.getUserById(userId);
        log.info("Fetched user details for userId: {}", userId);
        return ResponseEntity.ok(user);
    }
}
