package com.revshop.order.controller;

import com.revshop.order.dto.CreateOrderRequest;
import com.revshop.order.dto.OrderResponse;
import com.revshop.order.dto.UpdateOrderStatusRequest;
import com.revshop.order.service.OrderService;
import com.revshop.order.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("POST /api/orders - userId: {}, itemCount: {}", request.getUserId(), request.getItems().size());
        OrderResponse response = orderService.createOrder(request);
        log.info("Order created successfully with orderId: {}", response.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        log.info("GET /api/orders/{}", orderId);
        OrderResponse response = orderService.getOrderById(orderId);
        log.info("Fetched order {}", orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("GET /api/orders/my - userId: {}", userId);
        List<OrderResponse> orders = orderService.getOrdersByBuyer(userId);
        log.info("Fetched {} buyer orders for userId: {}", orders.size(), userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/seller")
    public ResponseEntity<List<OrderResponse>> getSellerOrders(HttpServletRequest request) {
        Long sellerId = JwtUtil.getUserIdFromRequest(request);
        log.info("GET /api/orders/seller - sellerId: {}", sellerId);
        List<OrderResponse> orders = orderService.getOrdersBySeller(sellerId);
        log.info("Fetched {} seller orders for sellerId: {}", orders.size(), sellerId);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        log.info("PUT /api/orders/{}/status - status: {}", orderId, request.getStatus());
        OrderResponse response = orderService.updateOrderStatus(orderId, request.getStatus());
        log.info("Order {} status updated to {}", orderId, response.getStatus());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(
            @PathVariable Long orderId,
            HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("PUT /api/orders/{}/cancel - userId: {}", orderId, userId);
        orderService.cancelOrder(orderId, userId);
        log.info("Order {} cancelled for userId: {}", orderId, userId);
        return ResponseEntity.ok("Order cancelled successfully");
    }
}
