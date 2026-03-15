import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, OrderRequest } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css']
})
export class PaymentPageComponent {

  orderId: string = '';

  paymentMethod = 'COD';
  isProcessing = false;
  message = '';
  isError = false;

  orderPayload: OrderRequest | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private cartService: CartService,
    private productService: ProductService,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state?.['orderPayload']) {
      this.orderPayload = nav.extras.state['orderPayload'];
    }
  }

  ngOnInit() {
    if (!this.orderPayload && !this.orderId) {
      this.router.navigate(['/checkout']);
    }
  }

  pay(): void {
    this.message = '';
    this.isError = false;

    if (!this.orderPayload) {
      this.isError = true;
      this.message = 'Missing order payload. Please place order again.';
      return;
    }

    if (!this.orderPayload.items?.length) {
      this.isError = true;
      this.message = 'No order items found. Please place order again.';
      return;
    }

    this.isProcessing = true;
    const payload: OrderRequest = {
      ...this.orderPayload,
      paymentMethod: this.paymentMethod,
      paymentStatus: 'SUCCESS',
      items: [...this.orderPayload.items]
    };

    const itemDetailRequests = payload.items.map(item =>
      this.productService.getProductDetails(item.productId).pipe(
        map(product => ({ item, product }))
      )
    );

    forkJoin(itemDetailRequests).subscribe({
      next: (details) => {
        payload.items = details.map(({ item, product }) => ({
          productId: item.productId,
          productName: item.productName || product?.name || `Product #${item.productId}`,
          sellerId: item.sellerId > 0 ? item.sellerId : Number(product?.sellerId ?? 0),
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase > 0 ? item.priceAtPurchase : Number(product?.price ?? 0)
        }));

        const hasInvalidItem = payload.items.some(item =>
          !item.productName || item.sellerId <= 0 || item.priceAtPurchase <= 0
        );

        if (hasInvalidItem) {
          this.isProcessing = false;
          this.isError = true;
          this.message = 'Order item details are incomplete. Please refresh cart and try again.';
          return;
        }

        this.orderService.placeOrder(payload).subscribe({
          next: (response) => {
            this.isProcessing = false;
            this.message = 'Payment successful.';

            this.cartService.clearCart(payload.userId).subscribe();

            this.router.navigate(['/order-confirmation'], {
              queryParams: {
                orderId: response.orderId,
                paymentMethod: this.paymentMethod
              }
            });
          },
          error: () => {
            this.isProcessing = false;
            this.isError = true;
            this.message = 'Payment request failed. Please try again.';
          }
        });
      },
      error: () => {
        this.isProcessing = false;
        this.isError = true;
        this.message = 'Could not validate product details for this order.';
      }
    });
  }
}
