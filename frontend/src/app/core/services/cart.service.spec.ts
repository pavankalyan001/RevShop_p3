import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds to cart, normalizes the payload, and updates the cart stream', () => {
    let latestCount = 0;
    service.cart$.subscribe(cart => {
      latestCount = cart?.totalItems ?? 0;
    });

    service.addToCart(1, 8, 2).subscribe(cart => {
      expect(cart.items[0].cartItemId).toBe(3);
      expect(cart.items[0].productPrice).toBe(150);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/cart/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ productId: 8, quantity: 2 });
    request.flush({
      cartId: 1,
      totalPrice: 300,
      totalItems: 2,
      items: [
        {
          id: 3,
          productId: 8,
          productName: 'Laptop',
          price: 150,
          quantity: 2,
          subtotal: 300
        }
      ]
    });

    expect(latestCount).toBe(2);
    expect(service.getCartItemCount()).toBe(2);
  });

  it('updates item quantity and keeps the shared cart state in sync', () => {
    service.updateCartItemQuantity(1, 4, 3).subscribe(cart => {
      expect(cart.totalItems).toBe(3);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/cart/items/4');
    expect(request.request.method).toBe('PUT');
    request.flush({
      cartId: 1,
      totalPrice: 450,
      totalItems: 3,
      items: []
    });
  });

  it('clears the cart and resets the cart stream to null', () => {
    let latestCartValue: number | null = 1;
    service.cart$.subscribe(cart => {
      latestCartValue = cart ? cart.totalItems : null;
    });

    service.clearCart(1).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/cart');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(latestCartValue).toBeNull();
  });
});
