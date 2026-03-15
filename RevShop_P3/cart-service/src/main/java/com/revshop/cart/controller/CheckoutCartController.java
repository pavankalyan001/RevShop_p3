package com.revshop.cart.controller;

import com.revshop.cart.dto.CartItemResponse;
import com.revshop.cart.dto.CartResponse;
import com.revshop.cart.dto.CheckoutCartItemResponse;
import com.revshop.cart.dto.CheckoutCartResponse;
import com.revshop.cart.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CheckoutCartController {

    private static final Logger log = LoggerFactory.getLogger(CheckoutCartController.class);

    private final CartService cartService;

    public CheckoutCartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<CheckoutCartResponse> getCartForCheckout(@PathVariable Long userId) {
        log.info("GET /api/cart/{} - checkout view", userId);
        CartResponse cart = cartService.getCart(userId);
        CheckoutCartResponse response = mapToCheckoutResponse(cart, userId);
        log.info("Prepared checkout cart for userId: {} with itemCount: {}", userId, response.getItems().size());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Void> clearCartForCheckout(@PathVariable Long userId) {
        log.info("DELETE /api/cart/{}/clear", userId);
        cartService.clearCart(userId);
        log.info("Checkout cart cleared for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }

    private CheckoutCartResponse mapToCheckoutResponse(CartResponse cart, Long userId) {
        List<CheckoutCartItemResponse> items = cart.getItems().stream()
                .map(this::mapItem)
                .toList();

        return new CheckoutCartResponse(
                cart.getCartId(),
                userId,
                items,
                cart.getTotalPrice()
        );
    }

    private CheckoutCartItemResponse mapItem(CartItemResponse item) {
        return new CheckoutCartItemResponse(
                item.getCartItemId(),
                item.getProductId(),
                item.getProductName(),
                item.getQuantity(),
                item.getProductPrice(),
                item.getSubtotal()
        );
    }
}
