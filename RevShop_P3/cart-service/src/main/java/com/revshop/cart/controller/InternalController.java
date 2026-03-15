package com.revshop.cart.controller;

import com.revshop.cart.dto.CartResponse;
import com.revshop.cart.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/cart")
public class InternalController {

    private static final Logger log = LoggerFactory.getLogger(InternalController.class);

    private final CartService cartService;

    public InternalController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * Internal endpoint for checkout-service to retrieve user's cart
     */
    @GetMapping("/{userId}")
    public ResponseEntity<CartResponse> getCartByUserId(@PathVariable Long userId) {
        log.info("GET /api/internal/cart/{}", userId);
        CartResponse response = cartService.getCart(userId);
        log.info("Fetched internal cart for userId: {} with totalItems: {}", userId, response.getTotalItems());
        return ResponseEntity.ok(response);
    }

    /**
     * Internal endpoint for checkout-service to clear cart after order completion
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCartByUserId(@PathVariable Long userId) {
        log.info("DELETE /api/internal/cart/{}", userId);
        cartService.clearCart(userId);
        log.info("Cleared internal cart for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }
}
