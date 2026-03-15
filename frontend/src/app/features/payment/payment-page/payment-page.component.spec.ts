import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PaymentPageComponent } from './payment-page.component';
import { OrderService, OrderRequest } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';

describe('PaymentPageComponent', () => {
  let component: PaymentPageComponent;
  let route: ActivatedRoute;
  let orderService: jasmine.SpyObj<OrderService>;
  let cartService: jasmine.SpyObj<CartService>;
  let productService: jasmine.SpyObj<ProductService>;
  let router: jasmine.SpyObj<Router>;

  const validPayload: OrderRequest = {
    userId: 5,
    totalAmount: 200,
    shippingAddress: 'Main Street',
    billingAddress: 'Main Street',
    contactName: 'Buyer',
    phoneNumber: '9999999999',
    paymentMethod: '',
    paymentStatus: 'PENDING',
    items: [
      {
        productId: 9,
        productName: '',
        sellerId: 0,
        quantity: 2,
        priceAtPurchase: 0
      }
    ]
  };

  beforeEach(() => {
    route = {} as ActivatedRoute;
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['placeOrder']);
    cartService = jasmine.createSpyObj<CartService>('CartService', ['clearCart']);
    cartService.clearCart.and.returnValue(of(void 0));
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['getProductDetails']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'getCurrentNavigation']);
    router.getCurrentNavigation.and.returnValue({
      extras: { state: { orderPayload: validPayload } }
    } as unknown as ReturnType<Router['getCurrentNavigation']>);

    component = new PaymentPageComponent(route, orderService, cartService, productService, router);
  });

  it('redirects back to checkout when no order payload is available on init', () => {
    router.getCurrentNavigation.and.returnValue(null);
    component = new PaymentPageComponent(route, orderService, cartService, productService, router);

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });

  it('shows an error if the order payload is missing', () => {
    component.orderPayload = null;

    component.pay();

    expect(component.isError).toBeTrue();
    expect(component.message).toBe('Missing order payload. Please place order again.');
  });

  it('shows an error if the order has no items', () => {
    component.orderPayload = { ...validPayload, items: [] };

    component.pay();

    expect(component.isError).toBeTrue();
    expect(component.message).toBe('No order items found. Please place order again.');
  });

  it('stops payment when product details are incomplete', () => {
    productService.getProductDetails.and.returnValue(of({
      id: 9,
      name: '',
      sellerId: 0,
      price: 0,
      description: '',
      mrp: 0,
      category: 1,
      quantity: 0,
      stockThreshold: 1
    }));

    component.pay();

    expect(component.isError).toBeTrue();
    expect(component.message).toBe('Order item details are incomplete. Please refresh cart and try again.');
    expect(orderService.placeOrder).not.toHaveBeenCalled();
  });

  it('places the order and clears the cart on successful payment', () => {
    productService.getProductDetails.and.returnValue(of({
      id: 9,
      name: 'Laptop',
      sellerId: 7,
      price: 100,
      description: 'Gaming laptop',
      mrp: 120,
      category: 1,
      quantity: 5,
      stockThreshold: 1
    }));
    orderService.placeOrder.and.returnValue(of({
      orderId: 88
    } as any));

    component.pay();

    expect(orderService.placeOrder).toHaveBeenCalledWith(jasmine.objectContaining({
      paymentMethod: 'COD',
      paymentStatus: 'SUCCESS',
      items: [
        jasmine.objectContaining({
          productId: 9,
          productName: 'Laptop',
          sellerId: 7,
          quantity: 2,
          priceAtPurchase: 100
        })
      ]
    }));
    expect(cartService.clearCart).toHaveBeenCalledWith(5);
    expect(router.navigate).toHaveBeenCalledWith(['/order-confirmation'], {
      queryParams: { orderId: 88, paymentMethod: 'COD' }
    });
  });

  it('shows a validation error when product details cannot be fetched', () => {
    productService.getProductDetails.and.returnValue(throwError(() => new Error('failed')));

    component.pay();

    expect(component.isError).toBeTrue();
    expect(component.message).toBe('Could not validate product details for this order.');
  });
});
