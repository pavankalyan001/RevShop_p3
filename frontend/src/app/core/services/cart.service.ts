import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CartItemResponse {
  cartItemId: number;
  productId: number;
  productName: string;
  productDescription?: string;
  productPrice: number;
  price: number;
  mrp?: number;
  discountPercentage?: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  totalPrice: number;
  totalItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private baseUrl = `${environment.apiBaseUrl}/cart`;

  // BehaviorSubject to share cart state across components
  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== 7️⃣ Add Product to Cart =====
  addToCart(_userId: number, productId: number, quantity: number): Observable<CartResponse> {
    return this.http.post<any>(`${this.baseUrl}/items`, {
      productId,
      quantity
    }).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // ===== 8️⃣ Update Cart Quantity =====
  updateCartItemQuantity(_userId: number, cartItemId: number, quantity: number): Observable<CartResponse> {
    return this.http.put<any>(`${this.baseUrl}/items/${cartItemId}`, {
      quantity
    }).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // ===== 9️⃣ Remove Product from Cart =====
  removeFromCart(_userId: number, cartItemId: number): Observable<CartResponse> {
    return this.http.delete<any>(`${this.baseUrl}/items/${cartItemId}`).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // ===== 9️⃣ View Cart =====
  getCart(_userId: number): Observable<CartResponse> {
    return this.http.get<any>(`${this.baseUrl}`).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // ===== Clear Cart =====
  clearCart(_userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}`).pipe(
      tap(() => this.cartSubject.next(null))
    );
  }

  // Get current cart count for badge display
  getCartItemCount(): number {
    const cart = this.cartSubject.getValue();
    return cart ? cart.totalItems : 0;
  }

  private normalizeCart(cart: any): CartResponse {
    return {
      cartId: Number(cart?.cartId ?? 0),
      totalPrice: Number(cart?.totalPrice ?? 0),
      totalItems: Number(cart?.totalItems ?? 0),
      items: (cart?.items || []).map((item: any) => {
        const productPrice = Number(item?.productPrice ?? item?.price ?? 0);
        return {
          cartItemId: Number(item?.cartItemId ?? item?.id ?? 0),
          productId: Number(item?.productId ?? 0),
          productName: item?.productName ?? '',
          productDescription: item?.productDescription ?? '',
          productPrice,
          price: productPrice,
          mrp: Number(item?.mrp ?? productPrice),
          discountPercentage: Number(item?.discountPercentage ?? 0),
          quantity: Number(item?.quantity ?? 0),
          availableStock: Number(item?.availableStock ?? Number.MAX_SAFE_INTEGER),
          subtotal: Number(item?.subtotal ?? 0)
        };
      })
    };
  }
}
