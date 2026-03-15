import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CheckoutPageComponent } from './checkout-page.component';
import { CartService } from '../../../core/services/cart.service';
import { AuthService, User } from '../../../core/services/auth.service';

describe('CheckoutPageComponent', () => {
  let component: CheckoutPageComponent;
  let cartService: jasmine.SpyObj<CartService>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };
  let route: ActivatedRoute & { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  let queryParamMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    localStorage.clear();
    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));
    route = {
      snapshot: { queryParamMap: convertToParamMap({}) },
      queryParamMap: queryParamMapSubject.asObservable()
    } as ActivatedRoute & { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };

    cartService = jasmine.createSpyObj<CartService>('CartService', ['getCart']);
    cartService.getCart.and.returnValue(of({
      cartId: 1,
      items: [],
      totalPrice: 0,
      totalItems: 0
    }));

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService = Object.assign(
      {} as jasmine.SpyObj<AuthService>,
      { currentUser$: new BehaviorSubject<User | null>({ id: 12, username: 'buyer', role: 'BUYER' }) }
    );

    component = new CheckoutPageComponent(route, cartService, router, authService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('prefills buyer details from localStorage and cart totals from the API', () => {
    localStorage.setItem('buyerName', 'Buyer');
    localStorage.setItem('phoneNumber', '9999999999');
    cartService.getCart.and.returnValue(of({
      cartId: 1,
      items: [],
      totalPrice: 450.5,
      totalItems: 3
    }));

    component.ngOnInit();

    expect(component.order.name).toBe('Buyer');
    expect(component.order.phoneNumber).toBe('9999999999');
    expect(component.order.totalAmount).toBe(450.5);
    expect(component.itemCount).toBe(1);
  });

  it('uses the query-string amount when present', () => {
    route.snapshot.queryParamMap = convertToParamMap({
      amount: '250',
      productId: '4',
      quantity: '2'
    });
    queryParamMapSubject.next(route.snapshot.queryParamMap);

    component.ngOnInit();

    expect(component.order.totalAmount).toBe(250);
    expect(component.productId).toBe('4');
    expect(component.itemCount).toBe(2);
  });

  it('shows an error when required checkout fields are missing', () => {
    component.placeOrder();

    expect(component.errorMessage).toBe('Please fill in all fields.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('validates the phone number before continuing to payment', () => {
    component.order = {
      name: 'Buyer',
      phoneNumber: '12',
      shippingAddress: 'Address',
      totalAmount: 100
    };

    component.placeOrder();

    expect(component.errorMessage).toBe('Enter a valid phone number (10 to 20 digits).');
  });

  it('navigates to payment with a normalized order payload', () => {
    component.ngOnInit();
    component.order = {
      name: ' Buyer ',
      phoneNumber: '(999) 999-9999',
      shippingAddress: '  Main Street ',
      totalAmount: 300
    };
    component.cartItems = [
      {
        cartItemId: 1,
        productId: 8,
        productName: 'Laptop',
        productPrice: 300,
        price: 300,
        quantity: 1,
        availableStock: 2,
        subtotal: 300
      }
    ];

    component.placeOrder();

    expect(router.navigate).toHaveBeenCalledWith(['/payment'], {
      state: {
        orderPayload: jasmine.objectContaining({
          userId: 12,
          totalAmount: 300,
          shippingAddress: 'Main Street',
          billingAddress: 'Main Street',
          contactName: 'Buyer',
          phoneNumber: '9999999999',
          paymentStatus: 'PENDING',
          items: [
            jasmine.objectContaining({
              productId: 8,
              productName: 'Laptop',
              quantity: 1,
              priceAtPurchase: 300
            })
          ]
        })
      }
    });
  });

  it('shows a fallback error when the cart lookup fails and no item payload exists', () => {
    cartService.getCart.and.returnValue(throwError(() => new Error('cart failed')));
    component.order = {
      name: 'Buyer',
      phoneNumber: '9999999999',
      shippingAddress: 'Address',
      totalAmount: 120
    };

    component.ngOnInit();
    component.placeOrder();

    expect(component.errorMessage).toBe('No items found in cart to purchase.');
  });
});
