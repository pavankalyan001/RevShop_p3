# Order Service - RevShop P3

## Overview
The Order Service is a microservice responsible for managing orders, notifications, and reviews in the RevShop e-commerce platform. This service is owned by **Gotam** and handles Order Management, Notifications, and Review functionality.

## Owner
- **Name**: Gotam
- **Responsibility**: Order Management and Notification / Review

## Technology Stack
- Java 17
- Spring Boot 3.3.2
- Spring Data JPA
- Spring Security with JWT
- Spring Cloud OpenFeign
- PostgreSQL
- Eureka Client (Service Discovery)
- Lombok
- Maven

## Port
- **8085**

## Database
- **Name**: revshop
- **Type**: PostgreSQL
- **Tables**: orders, order_items, notifications, reviews

## Features

### Order Management
- Create orders from checkout-service
- View order by ID
- View buyer's orders
- View seller's orders
- Update order status (PENDING, CONFIRMED, SHIPPED, DELIVERED)
- Cancel orders (only PENDING/CONFIRMED)
- Automatic notification triggers on status changes

### Notification Management
- Create notifications for order events
- Retrieve user notifications
- Retrieve unread notifications
- Mark notification as read
- Mark all notifications as read
- Notification types: ORDER_PLACED, ORDER_CONFIRMED, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, LOW_STOCK, NEW_REVIEW

### Review Management
- Add product reviews (verified purchase required)
- Get product reviews with average rating
- Get user's reviews
- Delete reviews (own reviews only)
- Automatic product rating updates via Feign client
- Prevent duplicate reviews per product-order combination

## API Endpoints

### Order Endpoints
```
POST   /api/orders                    - Create order (internal - from checkout)
GET    /api/orders/{orderId}          - Get order by ID
GET    /api/orders/my                 - Get buyer's orders (requires JWT)
GET    /api/orders/seller             - Get seller's orders (requires JWT)
PUT    /api/orders/{orderId}/status   - Update order status
PUT    /api/orders/{orderId}/cancel   - Cancel order (requires JWT)
```

### Notification Endpoints
```
GET    /api/notifications             - Get user notifications (requires JWT)
GET    /api/notifications/unread      - Get unread notifications (requires JWT)
PUT    /api/notifications/{id}/read   - Mark notification as read
PUT    /api/notifications/read-all    - Mark all as read (requires JWT)
```

### Review Endpoints
```
POST   /api/reviews                           - Add review (requires JWT)
GET    /api/reviews/product/{productId}       - Get product reviews with average
GET    /api/reviews/product/{productId}/average - Get average rating only
GET    /api/reviews/my                        - Get user's reviews (requires JWT)
DELETE /api/reviews/{reviewId}                - Delete review (requires JWT)
```

## Environment Variables
```
DB_URL=jdbc:postgresql://localhost:5432/revshop
DB_USERNAME=revshop
DB_PASSWORD=revshop123
PRODUCT_SERVICE_URL=http://localhost:8082
EUREKA_SERVER_URL=http://localhost:8761/eureka/
```

## Build and Run

### Prerequisites
- Java 17
- Maven
- PostgreSQL
- Eureka Server running on port 8761

### Build
```bash
mvn clean package
```

### Run
```bash
java -jar target/order-service-1.0.0.jar
```

### Docker Build
```bash
docker build -t order-service:latest .
```

### Docker Run
```bash
docker run -p 8085:8085 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/revshop \
  -e DB_USERNAME=revshop \
  -e DB_PASSWORD=revshop123 \
  -e PRODUCT_SERVICE_URL=http://product-service:8082 \
  -e EUREKA_SERVER_URL=http://eureka-server:8761/eureka/ \
  order-service:latest
```

## Entities

### Order
- id, userId, totalAmount, shippingAddress, billingAddress
- contactName, phoneNumber, paymentMethod, paymentStatus
- orderDate, status, createdAt

### OrderItem
- id, orderId, productId, productName, sellerId
- quantity, priceAtPurchase, subtotal

### Notification
- id, userId, message, type, referenceId, isRead, createdAt

### Review
- id, userId, productId, orderId, rating (1-5), comment, createdAt

## Business Rules

### Order Creation
1. Called by checkout-service with payment confirmation
2. Creates order with items
3. Notifies buyer about successful order placement
4. Notifies each seller about new orders

### Order Status Updates
1. PENDING -> CONFIRMED -> SHIPPED -> DELIVERED
2. Can cancel only if PENDING or CONFIRMED
3. Cannot cancel if SHIPPED or DELIVERED
4. Notifications sent on each status change

### Review Verification
1. User must have purchased the product
2. Order must not be cancelled
3. Product must be in the specified order
4. One review per product-order combination
5. Rating must be between 1-5
6. Updates product rating via Feign client

### Notifications
1. Auto-created on order events
2. Cannot be deleted, only marked as read
3. Sorted by creation date (newest first)

## Integration

### Feign Clients
- **ProductServiceClient**: Updates product ratings after review creation/deletion

### Service Discovery
- Registers with Eureka Server
- Can be discovered by other services

## Sample Data
The DataLoader seeds the database with sample orders, notifications, and reviews on startup (only if database is empty).

## Security
- JWT-based authentication
- User ID extracted from JWT token
- Authorization checks for order cancellation and review management
- CORS enabled for all origins

## Error Handling
- Global exception handler with custom error responses
- Validation error handling with field-level messages
- Custom exceptions: OrderNotFoundException, UnauthorizedException, ReviewNotAllowedException

## Future Enhancements
- Order history tracking
- Email notifications
- SMS notifications
- Review moderation
- Order invoice generation
- Return/refund management
