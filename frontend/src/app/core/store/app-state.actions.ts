import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { Product } from '../../features/seller-product/models/product.model';
import type { User } from '../services/auth.service';
import type { CartResponse } from '../services/cart.service';
import type { Favorite } from '../services/favorite.service';
import type { Notification } from '../services/notification.service';
import type { OrderResponse } from '../services/order.service';
import type { Review } from '../services/review.service';
import type { UiFeedbackMessage } from '../services/ui-feedback.service';

export const AuthStateActions = createActionGroup({
  source: 'Auth State',
  events: {
    'Set Current User': props<{ user: User | null }>(),
    'Reset Session': emptyProps()
  }
});

export const CartStateActions = createActionGroup({
  source: 'Cart State',
  events: {
    'Set Cart': props<{ cart: CartResponse | null }>(),
    'Clear Cart': emptyProps()
  }
});

export const FavoritesStateActions = createActionGroup({
  source: 'Favorites State',
  events: {
    'Set Favorites': props<{ favorites: Favorite[] }>(),
    'Add Favorite': props<{ favorite: Favorite }>(),
    'Remove Favorite': props<{ productId: number }>()
  }
});

export const ProductsStateActions = createActionGroup({
  source: 'Products State',
  events: {
    'Set All Products': props<{ products: Product[] }>(),
    'Set Seller Products': props<{ products: Product[] }>(),
    'Set Search Results': props<{ products: Product[] }>(),
    'Set Selected Product': props<{ product: Product | null }>(),
    'Upsert Product': props<{ product: Product }>(),
    'Remove Product': props<{ id: number }>()
  }
});

export const OrdersStateActions = createActionGroup({
  source: 'Orders State',
  events: {
    'Set Buyer Orders': props<{ orders: OrderResponse[] }>(),
    'Set Seller Orders': props<{ orders: OrderResponse[] }>(),
    'Set Selected Order': props<{ order: OrderResponse | null }>(),
    'Upsert Order': props<{ order: OrderResponse }>(),
    'Update Order Status': props<{ orderId: number; status: string }>()
  }
});

export const NotificationsStateActions = createActionGroup({
  source: 'Notifications State',
  events: {
    'Set Notifications': props<{ notifications: Notification[] }>(),
    'Mark As Read': props<{ id: number }>()
  }
});

export const ReviewsStateActions = createActionGroup({
  source: 'Reviews State',
  events: {
    'Set Product Reviews': props<{ productId: number; reviews: Review[] }>(),
    'Set Buyer Reviews': props<{ reviews: Review[] }>(),
    'Set Seller Reviews': props<{ reviews: Review[] }>(),
    'Upsert Review': props<{ review: Review }>(),
    'Remove Review': props<{ reviewId: number }>(),
    'Set Average Rating': props<{ productId: number; averageRating: number }>()
  }
});

export const UiFeedbackStateActions = createActionGroup({
  source: 'Ui Feedback State',
  events: {
    'Add Message': props<{ message: UiFeedbackMessage }>(),
    'Dismiss Message': props<{ id: number }>()
  }
});
