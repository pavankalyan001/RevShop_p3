import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { OrderService } from './order.service';
import { appReducers } from '../store/app-state.reducer';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, StoreModule.forRoot(appReducers)]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('places an order and normalizes the response', () => {
    let orderId = 0;
    service.placeOrder({
      userId: 5,
      totalAmount: 120,
      shippingAddress: 'Main Street',
      billingAddress: 'Main Street',
      contactName: 'Buyer',
      phoneNumber: '9999999999',
      paymentMethod: 'COD',
      paymentStatus: 'SUCCESS',
      items: []
    }).subscribe(order => {
      orderId = order.orderId;
      expect(order.buyerName).toBe('Buyer');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/orders');
    expect(request.request.method).toBe('POST');
    request.flush({
      id: 44,
      userId: 5,
      contactName: 'Buyer',
      totalAmount: 120,
      status: 'PENDING',
      items: []
    });

    expect(orderId).toBe(44);
  });

  it('loads seller orders through the seller endpoint', () => {
    service.getOrdersBySeller(7).subscribe(orders => {
      expect(orders.length).toBe(1);
      expect(orders[0].buyerId).toBe(5);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/orders/seller');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        orderId: 77,
        buyerId: 5,
        contactName: 'Buyer',
        status: 'SHIPPED',
        totalAmount: 220,
        items: []
      }
    ]);
  });

  it('cancels an order using the text cancel endpoint', () => {
    let response = '';
    service.cancelOrder(18).subscribe(value => {
      response = value;
    });

    const request = httpMock.expectOne('http://localhost:8080/api/orders/18/cancel');
    expect(request.request.method).toBe('PUT');
    request.flush('Cancelled');

    expect(response).toBe('Cancelled');
  });
});
