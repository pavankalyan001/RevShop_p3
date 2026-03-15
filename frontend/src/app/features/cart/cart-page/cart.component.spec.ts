import { BehaviorSubject, of, throwError } from 'rxjs';
import { CartComponent } from './cart.component';
import { CartResponse, CartService, CartItemResponse } from '../../../core/services/cart.service';
import { AuthService, User } from '../../../core/services/auth.service';

describe('CartComponent', () => {
  let component: CartComponent;
  let cartService: jasmine.SpyObj<CartService>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };

  const cartItem: CartItemResponse = {
    cartItemId: 1,
    productId: 10,
    productName: 'Laptop',
    productPrice: 100,
    price: 100,
    quantity: 2,
    availableStock: 5,
    subtotal: 200
  };

  const cart: CartResponse = {
    cartId: 1,
    items: [cartItem],
    totalPrice: 200,
    totalItems: 2
  };

  beforeEach(() => {
    cartService = jasmine.createSpyObj<CartService>('CartService', [
      'getCart',
      'updateCartItemQuantity',
      'removeFromCart',
      'clearCart'
    ]);
    authService = Object.assign(
      {} as jasmine.SpyObj<AuthService>,
      { currentUser$: new BehaviorSubject<User | null>({ id: 6, username: 'buyer', role: 'BUYER' }) }
    );

    cartService.getCart.and.returnValue(of(cart));
    cartService.updateCartItemQuantity.and.returnValue(of(cart));
    cartService.removeFromCart.and.returnValue(of({ ...cart, items: [], totalPrice: 0, totalItems: 0 }));
    cartService.clearCart.and.returnValue(of(void 0));

    component = new CartComponent(cartService, authService);
  });

  it('loads the cart on init for the current user', () => {
    component.ngOnInit();

    expect(cartService.getCart).toHaveBeenCalledWith(6);
    expect(component.cart?.totalItems).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('shows an error when loading the cart fails', () => {
    cartService.getCart.and.returnValue(throwError(() => new Error('failed')));

    component.loadCart();

    expect(component.error).toBe('Failed to load cart. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('updates quantity when increasing an item below available stock', () => {
    component.ngOnInit();

    component.increaseQuantity(cartItem);

    expect(cartService.updateCartItemQuantity).toHaveBeenCalledWith(6, 1, 3);
  });

  it('normalizes typed quantity input before updating the cart', () => {
    component.ngOnInit();
    const event = {
      target: { value: '12' }
    } as unknown as Event;

    component.onQuantityInput(cartItem, event);

    expect(cartService.updateCartItemQuantity).toHaveBeenCalledWith(6, 1, 5);
  });

  it('removes and clears items from the cart', () => {
    component.ngOnInit();
    component.removeItem(1);
    component.clearCart();

    expect(cartService.removeFromCart).toHaveBeenCalledWith(6, 1);
    expect(cartService.clearCart).toHaveBeenCalledWith(6);
    expect(component.cart?.items).toEqual([]);
    expect(component.isCartEmpty).toBeTrue();
  });
});
