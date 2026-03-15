import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { UiFeedbackService } from '../../../core/services/ui-feedback.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

  product: any;
  isFavorite: boolean = false;
  userId: number | undefined;

  constructor(
    private route: ActivatedRoute,
    private service: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private favoriteService: FavoriteService,
    private uiFeedbackService: UiFeedbackService
  ) { }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.service.getProductDetails(id)
      .subscribe(res => {
        this.product = res;
        this.authService.currentUser$.subscribe(user => {
          if (user) {
            this.userId = user.id;
            this.checkFavoriteStatus();
          }
        });
      });
  }

  checkFavoriteStatus() {
    if (!this.userId || !this.product) return;
    this.favoriteService.isFavorite(this.userId, this.product.id).subscribe(res => {
      this.isFavorite = res.isFavorite;
    });
  }

  toggleFavorite() {
    if (!this.userId) {
      this.uiFeedbackService.info('Please log in first to manage favorites.');
      return;
    }

    if (this.isFavorite) {
      this.favoriteService.removeFavorite(this.userId, this.product.id).subscribe(() => {
        this.isFavorite = false;
      });
    } else {
      this.favoriteService.addFavorite(this.userId, this.product.id).subscribe(() => {
        this.isFavorite = true;
      });
    }
  }

  addToCart() {
    if (!this.product) return;
    const userId = this.authService.currentUser?.id;
    if (!userId) {
      this.uiFeedbackService.info('Please log in first to add items to cart.');
      return;
    }

    this.cartService.addToCart(userId, this.product.id, 1).subscribe({
      next: () => {
        this.uiFeedbackService.success(`${this.product.name} added to cart.`);
        this.cartService.getCart(userId).subscribe();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Could not add to cart';
        this.uiFeedbackService.error(msg);
      }
    });
  }
}
