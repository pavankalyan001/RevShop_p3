package com.revshop.checkout.client;

import com.revshop.checkout.dto.CartDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "cart-service", url = "${services.cart.url:http://localhost:8083}")
public interface CartServiceClient {

    @GetMapping("/api/cart/{userId}")
    CartDto getCart(@PathVariable("userId") Long userId);

    @DeleteMapping("/api/cart/{userId}/clear")
    void clearCart(@PathVariable("userId") Long userId);
}
