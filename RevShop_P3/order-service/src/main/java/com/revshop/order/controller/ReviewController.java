package com.revshop.order.controller;

import com.revshop.order.dto.ProductReviewsResponse;
import com.revshop.order.dto.ReviewRequest;
import com.revshop.order.dto.ReviewResponse;
import com.revshop.order.service.ReviewService;
import com.revshop.order.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    private static final Logger log = LoggerFactory.getLogger(ReviewController.class);

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(
            @Valid @RequestBody ReviewRequest request,
            HttpServletRequest httpRequest) {
        Long userId = JwtUtil.getUserIdFromRequest(httpRequest);
        log.info("POST /api/reviews - userId: {}, productId: {}, orderId: {}", userId, request.getProductId(), request.getOrderId());
        ReviewResponse response = reviewService.addReview(userId, request);
        log.info("Review created successfully with reviewId: {}", response.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ProductReviewsResponse> getProductReviews(@PathVariable Long productId) {
        log.info("GET /api/reviews/product/{}", productId);
        ProductReviewsResponse response = reviewService.getProductReviewsWithAverage(productId);
        log.info("Fetched {} reviews for productId: {}", response.getReviews().size(), productId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}/average")
    public ResponseEntity<Map<String, Double>> getProductAverageRating(@PathVariable Long productId) {
        log.info("GET /api/reviews/product/{}/average", productId);
        Double averageRating = reviewService.getAverageRating(productId);
        log.info("Fetched average rating {} for productId: {}", averageRating, productId);
        return ResponseEntity.ok(Map.of("averageRating", averageRating));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("GET /api/reviews/my - userId: {}", userId);
        List<ReviewResponse> reviews = reviewService.getUserReviews(userId);
        log.info("Fetched {} reviews for userId: {}", reviews.size(), userId);
        return ResponseEntity.ok(reviews);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<String> deleteReview(
            @PathVariable Long reviewId,
            HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("DELETE /api/reviews/{} - userId: {}", reviewId, userId);
        reviewService.deleteReview(reviewId, userId);
        log.info("Review {} deleted for userId: {}", reviewId, userId);
        return ResponseEntity.ok("Review deleted successfully");
    }
}
