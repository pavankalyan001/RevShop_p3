import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppState } from '../store/app-state.models';
import { OrdersStateActions } from '../store/app-state.actions';
import { selectBuyerOrders, selectSelectedOrder, selectSellerOrders } from '../store/app-state.selectors';

export interface OrderItemRequest {
  productId: number;
  productName: string;
  sellerId: number;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderRequest {
  userId: number;
  totalAmount: number;
  shippingAddress: string;
  billingAddress: string;
  contactName: string;
  phoneNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItemRequest[];
}

export interface OrderItemResponse {
  id?: number;
  productId: number;
  productName: string;
  sellerId?: number;
  quantity: number;
  priceAtPurchase: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  orderId: number;
  userId: number;
  buyerId: number;
  buyerName: string;
  buyerEmail: string;
  contactName: string;
  phoneNumber: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  createdAt?: string;
  items: OrderItemResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private API = `${environment.apiBaseUrl}/orders`;
  readonly buyerOrders$: Observable<OrderResponse[]>;
  readonly sellerOrders$: Observable<OrderResponse[]>;
  readonly selectedOrder$: Observable<OrderResponse | null>;

  constructor(private http: HttpClient, private store: Store<AppState>) {
    this.buyerOrders$ = this.store.select(selectBuyerOrders);
    this.sellerOrders$ = this.store.select(selectSellerOrders);
    this.selectedOrder$ = this.store.select(selectSelectedOrder);
  }

  placeOrder(order: OrderRequest): Observable<OrderResponse> {
    return this.http.post<any>(this.API, order).pipe(
      map((response) => this.normalizeOrder(response)),
      tap((normalizedOrder) => this.store.dispatch(OrdersStateActions.upsertOrder({ order: normalizedOrder })))
    );
  }

  getOrdersByBuyer(_buyerId: number): Observable<OrderResponse[]> {
    return this.http.get<any[]>(`${this.API}/my`).pipe(
      map((orders) => orders.map((order) => this.normalizeOrder(order))),
      tap((orders) => this.store.dispatch(OrdersStateActions.setBuyerOrders({ orders })))
    );
  }

  getOrdersBySeller(_sellerId: number): Observable<OrderResponse[]> {
    return this.http.get<any[]>(`${this.API}/seller`).pipe(
      map((orders) => orders.map((order) => this.normalizeOrder(order))),
      tap((orders) => this.store.dispatch(OrdersStateActions.setSellerOrders({ orders })))
    );
  }

  getOrderById(orderId: number): Observable<OrderResponse> {
    return this.http.get<any>(`${this.API}/${orderId}`).pipe(
      map((order) => this.normalizeOrder(order)),
      tap((order) => this.store.dispatch(OrdersStateActions.setSelectedOrder({ order })))
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<OrderResponse> {
    return this.http.put<any>(`${this.API}/${orderId}/status`, { status }).pipe(
      map((order) => this.normalizeOrder(order)),
      tap((order) => this.store.dispatch(OrdersStateActions.upsertOrder({ order })))
    );
  }

  cancelOrder(orderId: number): Observable<string> {
    return this.http.put(`${this.API}/${orderId}/cancel`, {}, { responseType: 'text' }).pipe(
      tap(() => this.store.dispatch(OrdersStateActions.updateOrderStatus({ orderId, status: 'CANCELLED' })))
    );
  }

  private normalizeOrder(order: any): OrderResponse {
    const items: OrderItemResponse[] = (order?.items || []).map((item: any) => ({
      id: Number(item?.id ?? 0),
      productId: Number(item?.productId ?? 0),
      productName: item?.productName ?? '',
      sellerId: Number(item?.sellerId ?? 0),
      quantity: Number(item?.quantity ?? 0),
      priceAtPurchase: Number(item?.priceAtPurchase ?? 0),
      subtotal: Number(item?.subtotal ?? 0)
    }));

    const id = Number(order?.id ?? order?.orderId ?? 0);
    const userId = Number(order?.userId ?? order?.buyerId ?? 0);

    return {
      id,
      orderId: id,
      userId,
      buyerId: userId,
      buyerName: order?.contactName ?? `User ${userId}`,
      buyerEmail: order?.buyerEmail ?? '',
      contactName: order?.contactName ?? '',
      phoneNumber: order?.phoneNumber ?? '',
      status: String(order?.status ?? 'PENDING'),
      totalAmount: Number(order?.totalAmount ?? 0),
      shippingAddress: order?.shippingAddress ?? '',
      billingAddress: order?.billingAddress ?? '',
      paymentMethod: order?.paymentMethod ?? '',
      paymentStatus: order?.paymentStatus ?? '',
      orderDate: order?.orderDate ?? '',
      createdAt: order?.createdAt,
      items
    };
  }
}
