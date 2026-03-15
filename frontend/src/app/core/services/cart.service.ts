import { Injectable, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CartStateActions } from '../store/app-state.actions';
import { AppState } from '../store/app-state.models';
import { selectCart, selectCartItemCount } from '../store/app-state.selectors';

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
  readonly cart$: Observable<CartResponse | null>;
  private readonly cartItemCountState: Signal<number>;

  constructor(private http: HttpClient, private store: Store<AppState>) {
    this.cart$ = this.store.select(selectCart);
    this.cartItemCountState = this.store.selectSignal(selectCartItemCount);
  }

  // ===== 7️⃣ Add Product to Cart =====
  addToCart(_userId: number, productId: number, quantity: number): Observable<CartResponse> {
    return this.http.post<any>(`${this.baseUrl}/items`, {
      productId,
      quantity
    }).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap((cart) => this.store.dispatch(CartStateActions.setCart({ cart })))
    );
  }

  // ===== 8️⃣ Update Cart Quantity =====
  updateCartItemQuantity(_userId: number, cartItemId: number, quantity: number): Observable<CartResponse> {
    return this.http.put<any>(`${this.baseUrl}/items/${cartItemId}`, {
      quantity
    }).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap((cart) => this.store.dispatch(CartStateActions.setCart({ cart })))
    );
  }

  // ===== 9️⃣ Remove Product from Cart =====
  removeFromCart(_userId: number, cartItemId: number): Observable<CartResponse> {
    return this.http.delete<any>(`${this.baseUrl}/items/${cartItemId}`).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap((cart) => this.store.dispatch(CartStateActions.setCart({ cart })))
    );
  }

  // ===== 9️⃣ View Cart =====
  getCart(_userId: number): Observable<CartResponse> {
    return this.http.get<any>(`${this.baseUrl}`).pipe(
      map((cart) => this.normalizeCart(cart)),
      tap((cart) => this.store.dispatch(CartStateActions.setCart({ cart })))
    );
  }

  // ===== Clear Cart =====
  clearCart(_userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}`).pipe(
      tap(() => this.store.dispatch(CartStateActions.clearCart()))
    );
  }

  // Get current cart count for badge display
  getCartItemCount(): number {
    return this.cartItemCountState();
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
