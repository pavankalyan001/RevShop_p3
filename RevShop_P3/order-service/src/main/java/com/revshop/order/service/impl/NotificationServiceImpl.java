package com.revshop.order.service.impl;

import com.revshop.order.dto.NotificationResponse;
import com.revshop.order.entity.Notification;
import com.revshop.order.entity.NotificationType;
import com.revshop.order.exception.OrderNotFoundException;
import com.revshop.order.repository.NotificationRepository;
import com.revshop.order.service.NotificationService;
import com.revshop.order.websocket.NotificationWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            NotificationWebSocketHandler notificationWebSocketHandler
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationWebSocketHandler = notificationWebSocketHandler;
    }

    @Override
    @Transactional
    public void createNotification(Long userId, String message, NotificationType type, Long referenceId) {
        log.info("Creating notification for userId: {}, type: {}, referenceId: {}", userId, type, referenceId);
        Notification notification = new Notification(userId, message, type, referenceId);
        Notification savedNotification = notificationRepository.save(notification);
        NotificationResponse response = mapToNotificationResponse(savedNotification);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.info("Dispatching notification {} over websocket after commit", savedNotification.getId());
                    notificationWebSocketHandler.sendNotification(userId, response);
                }
            });
            return;
        }

        log.info("Dispatching notification {} over websocket immediately", savedNotification.getId());
        notificationWebSocketHandler.sendNotification(userId, response);
    }

    @Override
    public List<NotificationResponse> getUserNotifications(Long userId) {
        log.info("Fetching notifications for userId: {}", userId);
        List<NotificationResponse> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToNotificationResponse)
                .collect(Collectors.toList());
        log.info("Fetched {} notifications for userId: {}", notifications.size(), userId);
        return notifications;
    }

    @Override
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        log.info("Fetching unread notifications for userId: {}", userId);
        List<NotificationResponse> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToNotificationResponse)
                .collect(Collectors.toList());
        log.info("Fetched {} unread notifications for userId: {}", notifications.size(), userId);
        return notifications;
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        log.info("Marking notification {} as read", notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new OrderNotFoundException("Notification not found with id: " + notificationId));
        notification.setIsRead(true);
        notificationRepository.save(notification);
        log.info("Notification {} marked as read", notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for userId: {}", userId);
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read for userId: {}", unreadNotifications.size(), userId);
    }

    private NotificationResponse mapToNotificationResponse(Notification notification) {
        log.info("Mapping notification {} for userId: {}", notification.getId(), notification.getUserId());
        return new NotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getMessage(),
                notification.getType(),
                notification.getReferenceId(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
    }
}
