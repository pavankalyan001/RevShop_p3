package com.revshop.order.controller;

import com.revshop.order.dto.NotificationResponse;
import com.revshop.order.service.NotificationService;
import com.revshop.order.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("GET /api/notifications - userId: {}", userId);
        List<NotificationResponse> notifications = notificationService.getUserNotifications(userId);
        log.info("Fetched {} notifications for userId: {}", notifications.size(), userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("GET /api/notifications/unread - userId: {}", userId);
        List<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId);
        log.info("Fetched {} unread notifications for userId: {}", notifications.size(), userId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<String> markAsRead(@PathVariable Long id) {
        log.info("PUT /api/notifications/{}/read", id);
        notificationService.markAsRead(id);
        log.info("Notification {} marked as read", id);
        return ResponseEntity.ok("Notification marked as read");
    }

    @PutMapping("/read-all")
    public ResponseEntity<String> markAllAsRead(HttpServletRequest request) {
        Long userId = JwtUtil.getUserIdFromRequest(request);
        log.info("PUT /api/notifications/read-all - userId: {}", userId);
        notificationService.markAllAsRead(userId);
        log.info("All notifications marked as read for userId: {}", userId);
        return ResponseEntity.ok("All notifications marked as read");
    }
}
