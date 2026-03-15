import { of, throwError } from 'rxjs';
import { SellerDashboardComponent } from './seller-dashboard.component';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { ReviewService } from '../../../../core/services/review.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';

describe('SellerDashboardComponent', () => {
  let component: SellerDashboardComponent;
  let productService: jasmine.SpyObj<ProductService>;
  let orderService: jasmine.SpyObj<OrderService>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService>;
  let authService: AuthService;
  let currentUser: User | null;

  beforeEach(() => {
    currentUser = { id: 7, username: 'seller', role: 'SELLER' };
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['getSellerProducts']);
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getOrdersBySeller', 'updateOrderStatus']);
    reviewService = jasmine.createSpyObj<ReviewService>('ReviewService', ['getReviewsBySeller']);
    uiFeedbackService = jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['success', 'error']);
    authService = {} as AuthService;
    Object.defineProperty(authService, 'currentUser', {
      get: () => currentUser
    });

    component = new SellerDashboardComponent(
      productService,
      authService,
      orderService,
      reviewService,
      uiFeedbackService
    );
  });

  it('shows an error when there is no authenticated seller', () => {
    currentUser = null;

    component.loadDashboardData();

    expect(component.dashboardMessage).toBe('Please login first to access the seller dashboard.');
    expect(uiFeedbackService.error).toHaveBeenCalled();
  });

  it('loads products, orders, reviews, and computes totals', () => {
    productService.getSellerProducts.and.returnValue(of([
      {
        id: 1,
        name: 'Laptop',
        description: 'Desc',
        price: 100,
        mrp: 120,
        category: 1,
        quantity: 2,
        sellerId: 7,
        discountPercentage: 0,
        stockThreshold: 3
      }
    ]));
    orderService.getOrdersBySeller.and.returnValue(of([
      {
        orderId: 9,
        items: [{ productId: 1, subtotal: 200 }]
      }
    ] as any));
    reviewService.getReviewsBySeller.and.returnValue(of([
      {
        id: 1,
        userId: 4,
        productId: 1,
        buyer: { id: 4, name: 'Buyer' },
        product: { id: 1, name: 'Laptop' },
        rating: 5,
        comment: 'Great',
        createdAt: '2024-01-01'
      }
    ]));

    component.loadDashboardData();

    expect(component.products.length).toBe(1);
    expect(component.lowStockItems.length).toBe(1);
    expect(component.totalOrders).toBe(1);
    expect(component.totalSales).toBe(200);
    expect(component.totalReviews).toBe(1);
  });

  it('updates order status and refreshes dashboard metrics', () => {
    orderService.updateOrderStatus.and.returnValue(of({} as any));
    spyOn(component, 'loadSalesMetrics');

    component.updateOrderStatus(11, 'SHIPPED');

    expect(orderService.updateOrderStatus).toHaveBeenCalledWith(11, 'SHIPPED');
    expect(component.dashboardMessage).toContain('Order #11 updated');
    expect(uiFeedbackService.success).toHaveBeenCalled();
    expect(component.loadSalesMetrics).toHaveBeenCalled();
  });

  it('shows an error when status update fails', () => {
    orderService.updateOrderStatus.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));

    component.updateOrderStatus(11, 'SHIPPED');

    expect(component.dashboardMessage).toBe('Update failed');
    expect(uiFeedbackService.error).toHaveBeenCalledWith('Update failed');
  });
});
