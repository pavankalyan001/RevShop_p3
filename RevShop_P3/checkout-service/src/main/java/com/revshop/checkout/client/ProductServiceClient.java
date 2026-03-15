package com.revshop.checkout.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "product-service", url = "${services.product.url:http://localhost:8082}")
public interface ProductServiceClient {

    @GetMapping("/api/products/{productId}/stock")
    Integer getProductStock(@PathVariable("productId") Long productId);

    @PutMapping("/api/products/{productId}/stock")
    void updateProductStock(@PathVariable("productId") Long productId, @RequestParam("quantity") Integer quantity);
}
