import { BehaviorSubject, of, throwError } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderService, OrderResponse } from '../../../core/services/order.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ReviewService, Review } from '../../../core/services/review.service';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let orderService: jasmine.SpyObj<OrderService>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };

  const order: OrderResponse = {
    id: 1,
    orderId: 1,
    userId: 4,
    buyerId: 4,
    buyerName: 'Buyer',
    buyerEmail: 'buyer@example.com',
    contactName: 'Buyer',
    phoneNumber: '9999999999',
    status: 'DELIVERED',
    totalAmount: 120,
    shippingAddress: 'Main Street',
    billingAddress: 'Main Street',
    paymentMethod: 'COD',
    paymentStatus: 'SUCCESS',
    orderDate: '2024-01-01',
    items: [
      {
        id: 1,
        productId: 8,
        productName: 'Laptop',
        sellerId: 7,
        quantity: 1,
        priceAtPurchase: 120,
        subtotal: 120
      }
    ]
  };

  beforeEach(() => {
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getOrdersByBuyer', 'cancelOrder']);
    reviewService = jasmine.createSpyObj<ReviewService>('ReviewService', ['getReviewsByBuyer', 'addReview']);
    authService = Object.assign(
      {} as jasmine.SpyObj<AuthService>,
      { currentUser$: new BehaviorSubject<User | null>({ id: 4, username: 'buyer', role: 'BUYER' }) }
    );
    component = new OrderListComponent(orderService, authService, reviewService);
  });

  it('loads orders and existing reviews for the buyer', () => {
    const reviews: Review[] = [
      {
        id: 1,
        userId: 4,
        productId: 8,
        buyer: { id: 4, name: 'Buyer' },
        product: { id: 8, name: 'Laptop' },
        rating: 5,
        comment: 'Great',
        createdAt: '2024-01-01'
      }
    ];
    orderService.getOrdersByBuyer.and.returnValue(of([order]));
    reviewService.getReviewsByBuyer.and.returnValue(of(reviews));

    component.ngOnInit();

    expect(component.orders.length).toBe(1);
    expect(component.reviewedProductIds.has(8)).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('shows an error when orders fail to load', () => {
    orderService.getOrdersByBuyer.and.returnValue(throwError(() => new Error('failed')));
    reviewService.getReviewsByBuyer.and.returnValue(of([]));

    component.loadOrders();

    expect(component.errorMessage).toBe('Failed to load orders');
    expect(component.loading).toBeFalse();
  });

  it('cancels an order after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    orderService.cancelOrder.and.returnValue(of('Cancelled'));
    spyOn(component, 'loadOrders');

    component.cancelOrder(1);

    expect(orderService.cancelOrder).toHaveBeenCalledWith(1);
    expect(component.loadOrders).toHaveBeenCalled();
  });

  it('submits a review successfully and closes the active review form', () => {
    reviewService.addReview.and.returnValue(of({
      id: 1,
      userId: 4,
      productId: 8,
      orderId: 1,
      buyer: { id: 4, name: 'Buyer' },
      product: { id: 8, name: 'Laptop' },
      rating: 5,
      comment: 'Great',
      createdAt: '2024-01-01'
    }));
    component.buyerId = 4;
    component.reviewDraft = { rating: 4, comment: ' Nice ' };
    component.activeReviewKey = component.getReviewKey(1, 8);

    component.submitReview(1, { productId: 8, productName: 'Laptop' });

    expect(reviewService.addReview).toHaveBeenCalledWith({
      buyerId: 4,
      productId: 8,
      orderId: 1,
      rating: 4,
      comment: 'Nice'
    });
    expect(component.reviewSuccess).toContain('Laptop');
    expect(component.activeReviewKey).toBeNull();
  });

  it('marks the product as reviewed when the backend says it was already reviewed', () => {
    reviewService.addReview.and.returnValue(throwError(() => ({ error: { message: 'Already reviewed' } })));
    component.buyerId = 4;
    component.activeReviewKey = component.getReviewKey(1, 8);

    component.submitReview(1, { productId: 8, productName: 'Laptop' });

    expect(component.reviewedProductIds.has(8)).toBeTrue();
    expect(component.activeReviewKey).toBeNull();
  });
});
