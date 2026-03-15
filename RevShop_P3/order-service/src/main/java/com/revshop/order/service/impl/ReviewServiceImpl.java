package com.revshop.order.service.impl;

import com.revshop.order.client.ProductServiceClient;
import com.revshop.order.dto.ProductReviewsResponse;
import com.revshop.order.dto.ReviewRequest;
import com.revshop.order.dto.ReviewResponse;
import com.revshop.order.entity.*;
import com.revshop.order.exception.OrderNotFoundException;
import com.revshop.order.exception.ReviewNotAllowedException;
import com.revshop.order.exception.UnauthorizedException;
import com.revshop.order.repository.OrderRepository;
import com.revshop.order.repository.ReviewRepository;
import com.revshop.order.service.NotificationService;
import com.revshop.order.service.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewServiceImpl implements ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceImpl.class);

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final ProductServiceClient productServiceClient;

    public ReviewServiceImpl(ReviewRepository reviewRepository, OrderRepository orderRepository, NotificationService notificationService, ProductServiceClient productServiceClient) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.productServiceClient = productServiceClient;
    }

    @Override
    @Transactional
    public ReviewResponse addReview(Long userId, ReviewRequest request) {
        log.info("Adding review for userId: {}, productId: {}, orderId: {}", userId, request.getProductId(), request.getOrderId());
        // Verify that the user purchased this product in this order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getUserId().equals(userId)) {
            log.warn("Review creation denied because userId: {} does not own orderId: {}", userId, request.getOrderId());
            throw new UnauthorizedException("You can only review your own purchases");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            log.warn("Review creation denied because order {} is cancelled", request.getOrderId());
            throw new ReviewNotAllowedException("Cannot review a cancelled order");
        }

        // Check if the product is in this order
        boolean productInOrder = order.getOrderItems().stream()
                .anyMatch(item -> item.getProductId().equals(request.getProductId()));

        if (!productInOrder) {
            log.warn("Review creation denied because productId: {} is not part of orderId: {}", request.getProductId(), request.getOrderId());
            throw new ReviewNotAllowedException("You can only review products you have purchased");
        }

        // Check for duplicate review
        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, request.getProductId(), request.getOrderId())) {
            log.warn("Duplicate review rejected for userId: {}, productId: {}, orderId: {}", userId, request.getProductId(), request.getOrderId());
            throw new ReviewNotAllowedException("You have already reviewed this product for this order");
        }

        Review review = new Review();
        review.setUserId(userId);
        review.setProductId(request.getProductId());
        review.setOrderId(request.getOrderId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review savedReview = reviewRepository.save(review);
        log.info("Review saved with reviewId: {}", savedReview.getId());

        // Update product rating via Feign client
        Double averageRating = getAverageRating(request.getProductId());
        try {
            productServiceClient.updateProductRating(request.getProductId(), averageRating);
        } catch (Exception e) {
            log.warn("Failed to update product rating for productId: {} - {}", request.getProductId(), e.getMessage());
        }

        // Notify seller about the new review
        OrderItem orderItem = order.getOrderItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst()
                .orElse(null);

        if (orderItem != null) {
            notificationService.createNotification(
                    orderItem.getSellerId(),
                    "New " + request.getRating() + "-star review for product: " + orderItem.getProductName(),
                    NotificationType.NEW_REVIEW,
                    savedReview.getId()
            );
            log.info("Seller notification created for reviewId: {}", savedReview.getId());
        }

        log.info("Review {} created successfully", savedReview.getId());
        return mapToReviewResponse(savedReview);
    }

    @Override
    public List<ReviewResponse> getProductReviews(Long productId) {
        log.info("Fetching reviews for productId: {}", productId);
        List<ReviewResponse> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
        log.info("Fetched {} reviews for productId: {}", reviews.size(), productId);
        return reviews;
    }

    @Override
    public List<ReviewResponse> getUserReviews(Long userId) {
        log.info("Fetching reviews for userId: {}", userId);
        List<ReviewResponse> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
        log.info("Fetched {} reviews for userId: {}", reviews.size(), userId);
        return reviews;
    }

    @Override
    public ProductReviewsResponse getProductReviewsWithAverage(Long productId) {
        log.info("Fetching reviews with average for productId: {}", productId);
        List<ReviewResponse> reviews = getProductReviews(productId);
        Double averageRating = getAverageRating(productId);
        Long totalReviews = reviewRepository.countByProductId(productId);

        log.info("Fetched reviews summary for productId: {} with averageRating: {} and totalReviews: {}", productId, averageRating, totalReviews);
        return new ProductReviewsResponse(reviews, averageRating, totalReviews);
    }

    @Override
    public Double getAverageRating(Long productId) {
        log.info("Calculating average rating for productId: {}", productId);
        Double average = reviewRepository.findAverageRatingByProductId(productId);
        Double roundedAverage = average != null ? Math.round(average * 10.0) / 10.0 : 0.0;
        log.info("Average rating for productId: {} is {}", productId, roundedAverage);
        return roundedAverage;
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        log.info("Deleting review {} for userId: {}", reviewId, userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new OrderNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUserId().equals(userId)) {
            log.warn("Review deletion denied for userId: {} on reviewId: {}", userId, reviewId);
            throw new UnauthorizedException("You can only delete your own reviews");
        }

        Long productId = review.getProductId();
        reviewRepository.delete(review);

        // Update product rating after deletion
        Double averageRating = getAverageRating(productId);
        try {
            productServiceClient.updateProductRating(productId, averageRating);
        } catch (Exception e) {
            log.warn("Failed to update product rating after deleting review {} - {}", reviewId, e.getMessage());
        }
        log.info("Review {} deleted successfully", reviewId);
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        log.info("Mapping review {} for productId: {}", review.getId(), review.getProductId());
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getProductId(),
                review.getOrderId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
