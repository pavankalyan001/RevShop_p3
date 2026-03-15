package com.revshop.cart.service.impl;

import com.revshop.cart.client.ProductServiceClient;
import com.revshop.cart.dto.FavoriteResponse;
import com.revshop.cart.dto.ProductDto;
import com.revshop.cart.exception.DuplicateResourceException;
import com.revshop.cart.exception.ResourceNotFoundException;
import com.revshop.cart.model.Favorite;
import com.revshop.cart.repository.FavoriteRepository;
import com.revshop.cart.service.FavoriteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    private static final Logger log = LoggerFactory.getLogger(FavoriteServiceImpl.class);

    private final FavoriteRepository favoriteRepository;
    private final ProductServiceClient productServiceClient;

    public FavoriteServiceImpl(FavoriteRepository favoriteRepository,
                              ProductServiceClient productServiceClient) {
        this.favoriteRepository = favoriteRepository;
        this.productServiceClient = productServiceClient;
    }

    @Override
    @Transactional
    public FavoriteResponse addFavorite(Long userId, Long productId) {
        log.info("Adding favorite for userId: {} and productId: {}", userId, productId);
        // Check if already favorited
        if (favoriteRepository.existsByUserIdAndProductId(userId, productId)) {
            log.warn("Favorite already exists for userId: {} and productId: {}", userId, productId);
            throw new DuplicateResourceException("Product is already in your favorites");
        }

        // Get product details from product-service
        ProductDto product = productServiceClient.getProduct(productId);

        if (product == null || product.getId() == null) {
            log.warn("Favorite creation failed because product {} was not found", productId);
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        // Create and save favorite
        Favorite favorite = new Favorite(
                userId,
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getImageUrl()
        );

        Favorite savedFavorite = favoriteRepository.save(favorite);
        log.info("Favorite created with id: {} for userId: {}", savedFavorite.getId(), userId);
        return mapToResponse(savedFavorite);
    }

    @Override
    @Transactional
    public void removeFavorite(Long userId, Long productId) {
        log.info("Removing favorite for userId: {} and productId: {}", userId, productId);
        Favorite favorite = favoriteRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite not found"));

        favoriteRepository.delete(favorite);
        log.info("Favorite removed for userId: {} and productId: {}", userId, productId);
    }

    @Override
    public List<FavoriteResponse> getFavorites(Long userId) {
        log.info("Fetching favorites for userId: {}", userId);
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        log.info("Fetched {} favorites for userId: {}", favorites.size(), userId);
        return favorites.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isFavorite(Long userId, Long productId) {
        boolean isFavorite = favoriteRepository.existsByUserIdAndProductId(userId, productId);
        log.info("Favorite check for userId: {} and productId: {} returned {}", userId, productId, isFavorite);
        return isFavorite;
    }

    // Helper Method
    private FavoriteResponse mapToResponse(Favorite favorite) {
        log.info("Mapping favorite {} for productId: {}", favorite.getId(), favorite.getProductId());
        return new FavoriteResponse(
                favorite.getId(),
                favorite.getProductId(),
                favorite.getProductName(),
                favorite.getProductPrice(),
                favorite.getProductImage(),
                favorite.getAddedAt()
        );
    }
}
