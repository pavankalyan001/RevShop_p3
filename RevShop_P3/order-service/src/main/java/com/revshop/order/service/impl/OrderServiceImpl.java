package com.revshop.order.service.impl;

import com.revshop.order.dto.CreateOrderRequest;
import com.revshop.order.dto.OrderItemResponse;
import com.revshop.order.dto.OrderResponse;
import com.revshop.order.entity.*;
import com.revshop.order.exception.OrderNotFoundException;
import com.revshop.order.exception.UnauthorizedException;
import com.revshop.order.repository.OrderRepository;
import com.revshop.order.service.NotificationService;
import com.revshop.order.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public OrderServiceImpl(OrderRepository orderRepository, NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating order for userId: {} with {} items", request.getUserId(), request.getItems().size());
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setTotalAmount(request.getTotalAmount());
        order.setShippingAddress(request.getShippingAddress());
        order.setBillingAddress(request.getBillingAddress());
        order.setContactName(request.getContactName());
        order.setPhoneNumber(request.getPhoneNumber());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(request.getPaymentStatus());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

        for (CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemRequest.getProductId());
            orderItem.setProductName(itemRequest.getProductName());
            orderItem.setSellerId(itemRequest.getSellerId());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPriceAtPurchase(itemRequest.getPriceAtPurchase());
            orderItem.setSubtotal(itemRequest.getQuantity() * itemRequest.getPriceAtPurchase());
            order.addOrderItem(orderItem);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order persisted with orderId: {}", savedOrder.getId());

        // Create notification for buyer
        notificationService.createNotification(
                savedOrder.getUserId(),
                "Your order #" + savedOrder.getId() + " has been placed successfully!",
                NotificationType.ORDER_PLACED,
                savedOrder.getId()
        );

        // Create notification for each seller
        savedOrder.getOrderItems().stream()
                .map(OrderItem::getSellerId)
                .distinct()
                .forEach(sellerId -> notificationService.createNotification(
                        sellerId,
                        "New order received! Order #" + savedOrder.getId(),
                        NotificationType.ORDER_PLACED,
                        savedOrder.getId()
                ));

        log.info("Order {} created successfully and notifications dispatched", savedOrder.getId());
        return mapToOrderResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(Long orderId) {
        log.info("Fetching order by orderId: {}", orderId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));
        log.info("Order {} fetched successfully", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getOrdersByBuyer(Long userId) {
        log.info("Fetching buyer orders for userId: {}", userId);
        List<OrderResponse> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId)
                .stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
        log.info("Fetched {} buyer orders for userId: {}", orders.size(), userId);
        return orders;
    }

    @Override
    public List<OrderResponse> getOrdersBySeller(Long sellerId) {
        log.info("Fetching seller orders for sellerId: {}", sellerId);
        List<OrderResponse> orders = orderRepository.findBySellerIdOrderByOrderDateDesc(sellerId)
                .stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
        log.info("Fetched {} seller orders for sellerId: {}", orders.size(), sellerId);
        return orders;
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {
        log.info("Updating order {} to status {}", orderId, status);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        log.info("Order {} status changed from {} to {}", orderId, previousStatus, status);

        // Create notification based on status
        NotificationType notificationType = getNotificationTypeForStatus(status);
        String message = getStatusChangeMessage(orderId, status);

        notificationService.createNotification(
                order.getUserId(),
                message,
                notificationType,
                orderId
        );

        log.info("Status update notification created for order {}", orderId);
        return mapToOrderResponse(updatedOrder);
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId, Long userId) {
        log.info("Cancelling order {} for userId: {}", orderId, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        if (!order.getUserId().equals(userId)) {
            log.warn("Order cancellation denied for userId: {} on orderId: {}", userId, orderId);
            throw new UnauthorizedException("You are not authorized to cancel this order");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            log.warn("Order {} cannot be cancelled because status is {}", orderId, order.getStatus());
            throw new IllegalStateException("Cannot cancel order that is already " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Notify buyer
        notificationService.createNotification(
                order.getUserId(),
                "Your order #" + orderId + " has been cancelled",
                NotificationType.ORDER_CANCELLED,
                orderId
        );

        // Notify sellers
        order.getOrderItems().stream()
                .map(OrderItem::getSellerId)
                .distinct()
                .forEach(sellerId -> notificationService.createNotification(
                        sellerId,
                        "Order #" + orderId + " has been cancelled by the buyer",
                        NotificationType.ORDER_CANCELLED,
                        orderId
                ));

        log.info("Order {} cancelled successfully", orderId);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        log.info("Mapping order {} with {} items to response", order.getId(), order.getOrderItems().size());
        List<OrderItemResponse> items = order.getOrderItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getSellerId(),
                        item.getQuantity(),
                        item.getPriceAtPurchase(),
                        item.getSubtotal()
                ))
                .collect(Collectors.toList());

        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getTotalAmount(),
                order.getShippingAddress(),
                order.getBillingAddress(),
                order.getContactName(),
                order.getPhoneNumber(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getOrderDate(),
                order.getStatus(),
                order.getCreatedAt(),
                items
        );
    }

    private NotificationType getNotificationTypeForStatus(OrderStatus status) {
        log.info("Resolving notification type for order status: {}", status);
        return switch (status) {
            case CONFIRMED -> NotificationType.ORDER_CONFIRMED;
            case SHIPPED -> NotificationType.ORDER_SHIPPED;
            case DELIVERED -> NotificationType.ORDER_DELIVERED;
            case CANCELLED -> NotificationType.ORDER_CANCELLED;
            default -> NotificationType.ORDER_PLACED;
        };
    }

    private String getStatusChangeMessage(Long orderId, OrderStatus status) {
        log.info("Building status-change message for order {} with status {}", orderId, status);
        return switch (status) {
            case CONFIRMED -> "Your order #" + orderId + " has been confirmed!";
            case SHIPPED -> "Your order #" + orderId + " has been shipped!";
            case DELIVERED -> "Your order #" + orderId + " has been delivered!";
            case CANCELLED -> "Your order #" + orderId + " has been cancelled";
            default -> "Order #" + orderId + " status updated to " + status;
        };
    }
}
