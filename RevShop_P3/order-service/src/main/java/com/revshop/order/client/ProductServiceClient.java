package com.revshop.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "product-service", url = "${product-service.url:http://localhost:8082}")
public interface ProductServiceClient {

    @PutMapping("/api/products/{productId}/rating")
    void updateProductRating(@PathVariable("productId") Long productId, @RequestParam("rating") Double rating);
}
