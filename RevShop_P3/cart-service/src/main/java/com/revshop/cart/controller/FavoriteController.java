package com.revshop.cart.controller;

import com.revshop.cart.dto.FavoriteResponse;
import com.revshop.cart.service.FavoriteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private static final Logger log = LoggerFactory.getLogger(FavoriteController.class);

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{productId}")
    public ResponseEntity<FavoriteResponse> addFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long productId) {
        log.info("POST /api/favorites/{} - userId: {}", productId, userId);
        FavoriteResponse response = favoriteService.addFavorite(userId, productId);
        log.info("Favorite created for userId: {} and productId: {}", userId, productId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long productId) {
        log.info("DELETE /api/favorites/{} - userId: {}", productId, userId);
        favoriteService.removeFavorite(userId, productId);
        log.info("Favorite removed for userId: {} and productId: {}", userId, productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> getFavorites(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("GET /api/favorites - userId: {}", userId);
        List<FavoriteResponse> favorites = favoriteService.getFavorites(userId);
        log.info("Fetched {} favorites for userId: {}", favorites.size(), userId);
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/{productId}/check")
    public ResponseEntity<Map<String, Boolean>> isFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long productId) {
        log.info("GET /api/favorites/{}/check - userId: {}", productId, userId);
        boolean isFav = favoriteService.isFavorite(userId, productId);
        log.info("Favorite check completed for userId: {}, productId: {}, isFavorite: {}", userId, productId, isFav);
        return ResponseEntity.ok(Map.of("isFavorite", isFav));
    }
}
