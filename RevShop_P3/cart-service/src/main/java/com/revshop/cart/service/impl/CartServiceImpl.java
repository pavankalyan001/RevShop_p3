package com.revshop.cart.service.impl;

import com.revshop.cart.client.ProductServiceClient;
import com.revshop.cart.dto.*;
import com.revshop.cart.exception.InsufficientStockException;
import com.revshop.cart.exception.ResourceNotFoundException;
import com.revshop.cart.model.Cart;
import com.revshop.cart.model.CartItem;
import com.revshop.cart.repository.CartItemRepository;
import com.revshop.cart.repository.CartRepository;
import com.revshop.cart.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private static final Logger log = LoggerFactory.getLogger(CartServiceImpl.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductServiceClient productServiceClient;

    public CartServiceImpl(CartRepository cartRepository,
                          CartItemRepository cartItemRepository,
                          ProductServiceClient productServiceClient) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productServiceClient = productServiceClient;
    }

    @Override
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        log.info("Adding product {} to cart for userId: {} with quantity: {}", request.getProductId(), userId, request.getQuantity());
        // Get product details from product-service
        ProductDto product = productServiceClient.getProduct(request.getProductId());

        if (product == null || product.getId() == null) {
            log.warn("Add-to-cart failed because product {} was not found", request.getProductId());
            throw new ResourceNotFoundException("Product not found with id: " + request.getProductId());
        }

        // Validate stock
        validateStock(product, request.getQuantity());

        // Get or create cart
        Cart cart = getOrCreateCart(userId);

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // Update existing item
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            validateStock(product, newQuantity);
            item.setQuantity(newQuantity);
        } else {
            // Add new item
            CartItem newItem = new CartItem(
                    product.getId(),
                    product.getName(),
                    product.getPrice(),
                    request.getQuantity()
            );
            cart.addItem(newItem);
        }

        Cart savedCart = cartRepository.save(cart);
        log.info("Cart saved for userId: {} with totalItems: {}", userId, savedCart.getTotalItems());
        return mapToResponse(savedCart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long userId, Long itemId, UpdateCartRequest request) {
        log.info("Updating cart item {} for userId: {} to quantity: {}", itemId, userId, request.getQuantity());
        Cart cart = getCartForUser(userId);
        CartItem cartItem = findCartItemById(cart, itemId);

        // Get product details to validate stock
        ProductDto product = productServiceClient.getProduct(cartItem.getProductId());
        validateStock(product, request.getQuantity());

        cartItem.setQuantity(request.getQuantity());
        Cart savedCart = cartRepository.save(cart);
        log.info("Cart item {} updated for userId: {}", itemId, userId);
        return mapToResponse(savedCart);
    }

    @Override
    @Transactional
    public CartResponse removeFromCart(Long userId, Long itemId) {
        log.info("Removing cart item {} for userId: {}", itemId, userId);
        Cart cart = getCartForUser(userId);
        CartItem cartItem = findCartItemById(cart, itemId);

        cart.removeItem(cartItem);
        cartItemRepository.delete(cartItem);

        Cart savedCart = cartRepository.save(cart);
        log.info("Cart item {} removed for userId: {}", itemId, userId);
        return mapToResponse(savedCart);
    }

    @Override
    public CartResponse getCart(Long userId) {
        log.info("Fetching cart for userId: {}", userId);
        return cartRepository.findByUserId(userId)
                .map(this::mapToResponse)
                .orElseGet(() -> {
                    log.info("No cart found for userId: {}, returning empty cart", userId);
                    return this.emptyCartResponse();
                });
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        log.info("Clearing cart for userId: {}", userId);
        Cart cart = getCartForUser(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
        log.info("Cart cleared for userId: {}", userId);
    }

    // Helper Methods
    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating new cart for userId: {}", userId);
                    Cart newCart = new Cart(userId);
                    return cartRepository.save(newCart);
                });
    }

    private Cart getCartForUser(Long userId) {
        log.info("Loading cart entity for userId: {}", userId);
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));
    }

    private CartItem findCartItemById(Cart cart, Long itemId) {
        log.info("Locating cart item {} in cartId: {}", itemId, cart.getId());
        return cart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));
    }

    private void validateStock(ProductDto product, int requestedQuantity) {
        if (product.getQuantity() == null || requestedQuantity > product.getQuantity()) {
            log.warn("Stock validation failed for productId: {} with requestedQuantity: {} and availableStock: {}",
                    product.getId(), requestedQuantity, product.getQuantity());
            throw new InsufficientStockException(
                    "Requested quantity (" + requestedQuantity +
                            ") exceeds available stock (" + product.getQuantity() + ")"
            );
        }
        log.info("Stock validated for productId: {} with requestedQuantity: {}", product.getId(), requestedQuantity);
    }

    private CartResponse emptyCartResponse() {
        return new CartResponse(null, List.of(), 0.0, 0);
    }

    private CartResponse mapToResponse(Cart cart) {
        log.info("Mapping cartId: {} to response with {} items", cart.getId(), cart.getItems().size());
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList());

        return new CartResponse(
                cart.getId(),
                items,
                cart.getTotalPrice(),
                cart.getTotalItems()
        );
    }

    private CartItemResponse mapItemToResponse(CartItem item) {
        log.info("Mapping cart item {} for productId: {}", item.getId(), item.getProductId());
        return new CartItemResponse(
                item.getId(),
                item.getProductId(),
                item.getProductName(),
                item.getProductPrice(),
                item.getQuantity(),
                item.getSubtotal()
        );
    }
}
