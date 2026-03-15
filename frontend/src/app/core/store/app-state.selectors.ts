import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  AUTH_FEATURE_KEY,
  AuthState,
  CART_FEATURE_KEY,
  CartState,
  FAVORITES_FEATURE_KEY,
  FavoritesState,
  NOTIFICATIONS_FEATURE_KEY,
  NotificationsState,
  ORDERS_FEATURE_KEY,
  OrdersState,
  PRODUCTS_FEATURE_KEY,
  ProductsState,
  REVIEWS_FEATURE_KEY,
  ReviewsState,
  UI_FEEDBACK_FEATURE_KEY,
  UiFeedbackState
} from './app-state.models';

export const selectAuthState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);
export const selectCartState = createFeatureSelector<CartState>(CART_FEATURE_KEY);
export const selectFavoritesState = createFeatureSelector<FavoritesState>(FAVORITES_FEATURE_KEY);
export const selectProductsState = createFeatureSelector<ProductsState>(PRODUCTS_FEATURE_KEY);
export const selectOrdersState = createFeatureSelector<OrdersState>(ORDERS_FEATURE_KEY);
export const selectNotificationsState = createFeatureSelector<NotificationsState>(NOTIFICATIONS_FEATURE_KEY);
export const selectReviewsState = createFeatureSelector<ReviewsState>(REVIEWS_FEATURE_KEY);
export const selectUiFeedbackState = createFeatureSelector<UiFeedbackState>(UI_FEEDBACK_FEATURE_KEY);

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state) => state.currentUser
);

export const selectCart = createSelector(
  selectCartState,
  (state) => state.cart
);

export const selectCartItemCount = createSelector(
  selectCart,
  (cart) => cart?.totalItems ?? 0
);

export const selectFavorites = createSelector(
  selectFavoritesState,
  (state) => state.items
);

export const selectFavoritesLoaded = createSelector(
  selectFavoritesState,
  (state) => state.loaded
);

export const selectIsFavorite = (productId: number) => createSelector(
  selectFavorites,
  (favorites) => favorites.some((favorite) => favorite.productId === productId)
);

export const selectAllProducts = createSelector(
  selectProductsState,
  (state) => state.allProducts
);

export const selectSellerProducts = createSelector(
  selectProductsState,
  (state) => state.sellerProducts
);

export const selectSearchResults = createSelector(
  selectProductsState,
  (state) => state.searchResults
);

export const selectSelectedProduct = createSelector(
  selectProductsState,
  (state) => state.selectedProduct
);

export const selectBuyerOrders = createSelector(
  selectOrdersState,
  (state) => state.buyerOrders
);

export const selectSellerOrders = createSelector(
  selectOrdersState,
  (state) => state.sellerOrders
);

export const selectSelectedOrder = createSelector(
  selectOrdersState,
  (state) => state.selectedOrder
);

export const selectNotifications = createSelector(
  selectNotificationsState,
  (state) => state.items
);

export const selectUnreadNotificationsCount = createSelector(
  selectNotifications,
  (notifications) => notifications.filter((notification) => !notification.read).length
);

export const selectBuyerReviews = createSelector(
  selectReviewsState,
  (state) => state.buyerReviews
);

export const selectSellerReviews = createSelector(
  selectReviewsState,
  (state) => state.sellerReviews
);

export const selectProductReviews = (productId: number) => createSelector(
  selectReviewsState,
  (state) => state.productReviews[productId] ?? []
);

export const selectAverageRating = (productId: number) => createSelector(
  selectReviewsState,
  (state) => state.averageRatings[productId] ?? 0
);

export const selectUiMessages = createSelector(
  selectUiFeedbackState,
  (state) => state.messages
);
