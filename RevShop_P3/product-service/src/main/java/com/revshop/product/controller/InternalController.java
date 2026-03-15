package com.revshop.product.controller;

import com.revshop.product.dto.ProductResponse;
import com.revshop.product.dto.StockUpdateRequest;
import com.revshop.product.service.ProductService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Internal Controller
 * Handles internal service-to-service communication
 * Should be secured at the gateway level to prevent external access
 */
@RestController
@RequestMapping("/api/internal/products")
public class InternalController {

    private static final Logger log = LoggerFactory.getLogger(InternalController.class);

    private final ProductService productService;

    public InternalController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        log.info("INTERNAL: GET /api/internal/products/{}", id);
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Void> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody StockUpdateRequest request) {
        log.info("INTERNAL: PUT /api/internal/products/{}/stock - quantity: {}", id, request.getQuantity());
        productService.updateStock(id, request.getQuantity());
        return ResponseEntity.ok().build();
    }
}
