package com.revshop.cart.controller;

import com.revshop.cart.dto.AddToCartRequest;
import com.revshop.cart.dto.CartResponse;
import com.revshop.cart.dto.UpdateCartRequest;
import com.revshop.cart.service.CartService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private static final Logger log = LoggerFactory.getLogger(CartController.class);

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody AddToCartRequest request) {
        log.info("POST /api/cart/items - userId: {}, productId: {}, quantity: {}",
                userId, request.getProductId(), request.getQuantity());
        CartResponse response = cartService.addToCart(userId, request);
        log.info("Cart updated after add-to-cart for userId: {} with totalItems: {}", userId, response.getTotalItems());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartRequest request) {
        log.info("PUT /api/cart/items/{} - userId: {}, quantity: {}", itemId, userId, request.getQuantity());
        CartResponse response = cartService.updateCartItem(userId, itemId, request);
        log.info("Cart item {} updated for userId: {} with totalItems: {}", itemId, userId, response.getTotalItems());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeFromCart(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long itemId) {
        log.info("DELETE /api/cart/items/{} - userId: {}", itemId, userId);
        CartResponse response = cartService.removeFromCart(userId, itemId);
        log.info("Cart item {} removed for userId: {} with totalItems: {}", itemId, userId, response.getTotalItems());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("GET /api/cart - userId: {}", userId);
        CartResponse response = cartService.getCart(userId);
        log.info("Fetched cart for userId: {} with totalItems: {}", userId, response.getTotalItems());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("DELETE /api/cart - userId: {}", userId);
        cartService.clearCart(userId);
        log.info("Cart cleared for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }
}
