import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { OrderConfirmationComponent } from './order-confirmation.component';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let route: ActivatedRoute;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    route = {
      snapshot: {
        queryParamMap: convertToParamMap({
          orderId: '123',
          paymentMethod: 'COD'
        })
      }
    } as ActivatedRoute;
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    component = new OrderConfirmationComponent(route, router);
  });

  it('maps COD to a human-friendly payment label', () => {
    component.ngOnInit();

    expect(component.orderId).toBe('123');
    expect(component.paymentMethodLabel).toBe('Cash on Delivery');
    expect(component.paymentIcon).toBe('💵');
  });

  it('falls back to a generic confirmation icon for unknown payment methods', () => {
    route = {
      snapshot: {
        queryParamMap: convertToParamMap({
          orderId: '321',
          paymentMethod: 'UPI'
        })
      }
    } as ActivatedRoute;
    component = new OrderConfirmationComponent(route, router);

    component.ngOnInit();

    expect(component.paymentMethodLabel).toBe('UPI');
    expect(component.paymentIcon).toBe('✅');
  });

  it('navigates to orders and shopping routes from the action buttons', () => {
    component.goToOrders();
    component.continueShopping();

    expect(router.navigate).toHaveBeenCalledWith(['/orders']);
    expect(router.navigate).toHaveBeenCalledWith(['/buyer/dashboard']);
  });
});
