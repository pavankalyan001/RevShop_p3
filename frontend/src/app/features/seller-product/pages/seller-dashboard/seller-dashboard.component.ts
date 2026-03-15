import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { Review, ReviewService } from '../../../../core/services/review.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';

@Component({
  selector: 'app-seller-dashboard',
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.css']
})
export class SellerDashboardComponent implements OnInit {

  products: Product[] = [];
  selectedProduct: Product | null = null;

  // Widget metrics
  totalSales: number = 0;
  totalOrders: number = 0;
  lowStockItems: Product[] = [];

  // Orders Management
  activeTab: 'PRODUCTS' | 'ORDERS' | 'REVIEWS' = 'PRODUCTS';
  sellerOrders: any[] = [];
  sellerReviews: Review[] = [];
  totalReviews = 0;
  dashboardMessage = '';
  dashboardTone: 'success' | 'error' | 'info' = 'info';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private orderService: OrderService,
    private reviewService: ReviewService,
    private uiFeedbackService: UiFeedbackService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    if (!this.authService.currentUser) {
      this.setDashboardStatus('error', 'Please login first to access the seller dashboard.');
      this.uiFeedbackService.error('Please login first to access the seller dashboard.');
      return;
    }
    const sellerId = this.authService.currentUser.id;

    forkJoin({
      allProducts: this.productService.getSellerProducts(sellerId),
      orders: this.orderService.getOrdersBySeller(sellerId),
      reviews: this.reviewService.getReviewsBySeller(sellerId)
    }).subscribe({
      next: ({ allProducts, orders, reviews }) => {
        // 1. Process Products
        this.products = allProducts;
        this.lowStockItems = this.products.filter(p => Number(p.quantity) <= Number(p.stockThreshold));

        // 2. Process Orders
        this.totalOrders = orders.length;
        this.sellerOrders = orders;

        this.totalSales = 0;
        orders.forEach(o => {
          o.items.forEach(item => {
            const belongsToSeller = this.products.some(p => p.id === item.productId);
            if (belongsToSeller) {
              this.totalSales += Number(item.subtotal);
            }
          });
        });

        // 3. Process Reviews
        this.sellerReviews = reviews;
        this.totalReviews = reviews.length;
        this.clearDashboardStatus();
      },
      error: (err) => {
        this.setDashboardStatus('error', 'Could not load seller dashboard data.');
        console.error('Failed to load seller dashboard', err);
      }
    });
  }

  loadProducts() {
    if (!this.authService.currentUser) return;
    const sellerId = this.authService.currentUser.id;
    this.productService.getSellerProducts(sellerId).subscribe({
      next: (allProducts) => {
        this.products = allProducts;
        this.lowStockItems = this.products.filter(p => Number(p.quantity) <= Number(p.stockThreshold));
      },
      error: (err) => {
        this.setDashboardStatus('error', 'Could not refresh your product catalog.');
        console.error('Failed to refresh seller products', err);
      }
    });
  }

  loadSalesMetrics() {
    this.loadDashboardData();
  }

  edit(product: Product) {
    this.selectedProduct = { ...product };
  }

  clear() {
    this.selectedProduct = null;
  }

  onSaved() {
    this.selectedProduct = null;
    this.loadProducts();
  }

  updateOrderStatus(orderId: number, status: string) {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.setDashboardStatus('success', `Order #${orderId} updated to ${status.toLowerCase()}.`);
        this.uiFeedbackService.success(`Order #${orderId} updated to ${status.toLowerCase()}.`);
        this.loadSalesMetrics(); // Reload orders efficiently
      },
      error: (err) => {
        const message = err?.error?.message || err?.error || 'Failed to update order status';
        this.setDashboardStatus('error', message);
        this.uiFeedbackService.error(message);
        console.error(`Failed to update order ${orderId}`, err);
      }
    });
  }

  // Helper method to set tabs
  setTab(tab: 'PRODUCTS' | 'ORDERS' | 'REVIEWS') {
    this.activeTab = tab;
  }

  private setDashboardStatus(tone: 'success' | 'error' | 'info', message: string): void {
    this.dashboardTone = tone;
    this.dashboardMessage = message;
  }

  private clearDashboardStatus(): void {
    if (this.dashboardTone !== 'success') {
      this.dashboardMessage = '';
    }
  }

}
