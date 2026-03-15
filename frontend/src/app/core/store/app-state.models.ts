import type { Product } from '../../features/seller-product/models/product.model';
import type { User } from '../services/auth.service';
import type { CartResponse } from '../services/cart.service';
import type { Favorite } from '../services/favorite.service';
import type { Notification } from '../services/notification.service';
import type { OrderResponse } from '../services/order.service';
import type { Review } from '../services/review.service';
import type { UiFeedbackMessage } from '../services/ui-feedback.service';

export const AUTH_FEATURE_KEY = 'auth';
export const CART_FEATURE_KEY = 'cart';
export const FAVORITES_FEATURE_KEY = 'favorites';
export const PRODUCTS_FEATURE_KEY = 'products';
export const ORDERS_FEATURE_KEY = 'orders';
export const NOTIFICATIONS_FEATURE_KEY = 'notifications';
export const REVIEWS_FEATURE_KEY = 'reviews';
export const UI_FEEDBACK_FEATURE_KEY = 'uiFeedback';

export interface AuthState {
  currentUser: User | null;
}

export interface CartState {
  cart: CartResponse | null;
}

export interface FavoritesState {
  items: Favorite[];
  loaded: boolean;
}

export interface ProductsState {
  allProducts: Product[];
  sellerProducts: Product[];
  searchResults: Product[];
  selectedProduct: Product | null;
}

export interface OrdersState {
  buyerOrders: OrderResponse[];
  sellerOrders: OrderResponse[];
  selectedOrder: OrderResponse | null;
}

export interface NotificationsState {
  items: Notification[];
}

export interface ReviewsState {
  productReviews: Record<number, Review[]>;
  buyerReviews: Review[];
  sellerReviews: Review[];
  averageRatings: Record<number, number>;
}

export interface UiFeedbackState {
  messages: UiFeedbackMessage[];
}

export interface AppState {
  [AUTH_FEATURE_KEY]: AuthState;
  [CART_FEATURE_KEY]: CartState;
  [FAVORITES_FEATURE_KEY]: FavoritesState;
  [PRODUCTS_FEATURE_KEY]: ProductsState;
  [ORDERS_FEATURE_KEY]: OrdersState;
  [NOTIFICATIONS_FEATURE_KEY]: NotificationsState;
  [REVIEWS_FEATURE_KEY]: ReviewsState;
  [UI_FEEDBACK_FEATURE_KEY]: UiFeedbackState;
}

export const initialAuthState: AuthState = {
  currentUser: null
};

export const initialCartState: CartState = {
  cart: null
};

export const initialFavoritesState: FavoritesState = {
  items: [],
  loaded: false
};

export const initialProductsState: ProductsState = {
  allProducts: [],
  sellerProducts: [],
  searchResults: [],
  selectedProduct: null
};

export const initialOrdersState: OrdersState = {
  buyerOrders: [],
  sellerOrders: [],
  selectedOrder: null
};

export const initialNotificationsState: NotificationsState = {
  items: []
};

export const initialReviewsState: ReviewsState = {
  productReviews: {},
  buyerReviews: [],
  sellerReviews: [],
  averageRatings: {}
};

export const initialUiFeedbackState: UiFeedbackState = {
  messages: []
};
