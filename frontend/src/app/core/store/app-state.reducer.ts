import { Action, ActionReducerMap, createReducer, on } from '@ngrx/store';
import {
  AUTH_FEATURE_KEY,
  AppState,
  AuthState,
  CART_FEATURE_KEY,
  CartState,
  FAVORITES_FEATURE_KEY,
  FavoritesState,
  initialAuthState,
  initialCartState,
  initialFavoritesState,
  initialNotificationsState,
  initialOrdersState,
  initialProductsState,
  initialReviewsState,
  initialUiFeedbackState,
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
import {
  AuthStateActions,
  CartStateActions,
  FavoritesStateActions,
  NotificationsStateActions,
  OrdersStateActions,
  ProductsStateActions,
  ReviewsStateActions,
  UiFeedbackStateActions
} from './app-state.actions';

function upsertById<T extends { id?: number }>(items: T[], nextItem: T): T[] {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index === -1) {
    return [nextItem, ...items];
  }

  return items.map((item, currentIndex) => currentIndex === index ? nextItem : item);
}

function removeById<T extends { id?: number }>(items: T[], id: number): T[] {
  return items.filter((item) => item.id !== id);
}

function updateOrderStatus<T extends { orderId: number; status: string }>(
  items: T[],
  orderId: number,
  status: string
): T[] {
  return items.map((item) => item.orderId === orderId ? { ...item, status } : item);
}

const authReducerInternal = createReducer(
  initialAuthState,
  on(AuthStateActions.setCurrentUser, (state, { user }) => ({
    ...state,
    currentUser: user
  })),
  on(AuthStateActions.resetSession, () => initialAuthState)
);

export function authReducer(state: AuthState | undefined, action: Action): AuthState {
  return authReducerInternal(state, action);
}

const cartReducerInternal = createReducer(
  initialCartState,
  on(CartStateActions.setCart, (state, { cart }) => ({
    ...state,
    cart
  })),
  on(CartStateActions.clearCart, () => initialCartState),
  on(AuthStateActions.resetSession, () => initialCartState)
);

export function cartReducer(state: CartState | undefined, action: Action): CartState {
  return cartReducerInternal(state, action);
}

const favoritesReducerInternal = createReducer(
  initialFavoritesState,
  on(FavoritesStateActions.setFavorites, (state, { favorites }) => ({
    ...state,
    items: favorites,
    loaded: true
  })),
  on(FavoritesStateActions.addFavorite, (state, { favorite }) => ({
    ...state,
    items: state.items.some((item) => item.productId === favorite.productId)
      ? state.items.map((item) => item.productId === favorite.productId ? favorite : item)
      : [favorite, ...state.items],
    loaded: true
  })),
  on(FavoritesStateActions.removeFavorite, (state, { productId }) => ({
    ...state,
    items: state.items.filter((item) => item.productId !== productId),
    loaded: true
  })),
  on(AuthStateActions.resetSession, () => initialFavoritesState)
);

export function favoritesReducer(state: FavoritesState | undefined, action: Action): FavoritesState {
  return favoritesReducerInternal(state, action);
}

const productsReducerInternal = createReducer(
  initialProductsState,
  on(ProductsStateActions.setAllProducts, (state, { products }) => ({
    ...state,
    allProducts: products
  })),
  on(ProductsStateActions.setSellerProducts, (state, { products }) => ({
    ...state,
    sellerProducts: products
  })),
  on(ProductsStateActions.setSearchResults, (state, { products }) => ({
    ...state,
    searchResults: products
  })),
  on(ProductsStateActions.setSelectedProduct, (state, { product }) => ({
    ...state,
    selectedProduct: product
  })),
  on(ProductsStateActions.upsertProduct, (state, { product }) => ({
    ...state,
    allProducts: upsertById(state.allProducts, product),
    sellerProducts: upsertById(state.sellerProducts, product),
    searchResults: upsertById(state.searchResults, product),
    selectedProduct: state.selectedProduct?.id === product.id ? product : state.selectedProduct
  })),
  on(ProductsStateActions.removeProduct, (state, { id }) => ({
    ...state,
    allProducts: removeById(state.allProducts, id),
    sellerProducts: removeById(state.sellerProducts, id),
    searchResults: removeById(state.searchResults, id),
    selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct
  })),
  on(AuthStateActions.resetSession, () => initialProductsState)
);

export function productsReducer(state: ProductsState | undefined, action: Action): ProductsState {
  return productsReducerInternal(state, action);
}

const ordersReducerInternal = createReducer(
  initialOrdersState,
  on(OrdersStateActions.setBuyerOrders, (state, { orders }) => ({
    ...state,
    buyerOrders: orders
  })),
  on(OrdersStateActions.setSellerOrders, (state, { orders }) => ({
    ...state,
    sellerOrders: orders
  })),
  on(OrdersStateActions.setSelectedOrder, (state, { order }) => ({
    ...state,
    selectedOrder: order
  })),
  on(OrdersStateActions.upsertOrder, (state, { order }) => ({
    ...state,
    buyerOrders: upsertById(state.buyerOrders, order),
    sellerOrders: upsertById(state.sellerOrders, order),
    selectedOrder: state.selectedOrder?.orderId === order.orderId ? order : state.selectedOrder
  })),
  on(OrdersStateActions.updateOrderStatus, (state, { orderId, status }) => ({
    ...state,
    buyerOrders: updateOrderStatus(state.buyerOrders, orderId, status),
    sellerOrders: updateOrderStatus(state.sellerOrders, orderId, status),
    selectedOrder: state.selectedOrder?.orderId === orderId
      ? { ...state.selectedOrder, status }
      : state.selectedOrder
  })),
  on(AuthStateActions.resetSession, () => initialOrdersState)
);

export function ordersReducer(state: OrdersState | undefined, action: Action): OrdersState {
  return ordersReducerInternal(state, action);
}

const notificationsReducerInternal = createReducer(
  initialNotificationsState,
  on(NotificationsStateActions.setNotifications, (state, { notifications }) => ({
    ...state,
    items: notifications
  })),
  on(NotificationsStateActions.addNotification, (state, { notification }) => ({
    ...state,
    items: state.items.some((item) => item.id === notification.id)
      ? state.items.map((item) => item.id === notification.id ? notification : item)
      : [notification, ...state.items]
  })),
  on(NotificationsStateActions.markAsRead, (state, { id }) => ({
    ...state,
    items: state.items.map((notification) => notification.id === id
      ? { ...notification, isRead: true, read: true }
      : notification)
  })),
  on(AuthStateActions.resetSession, () => initialNotificationsState)
);

export function notificationsReducer(
  state: NotificationsState | undefined,
  action: Action
): NotificationsState {
  return notificationsReducerInternal(state, action);
}

const reviewsReducerInternal = createReducer(
  initialReviewsState,
  on(ReviewsStateActions.setProductReviews, (state, { productId, reviews }) => ({
    ...state,
    productReviews: {
      ...state.productReviews,
      [productId]: reviews
    }
  })),
  on(ReviewsStateActions.setBuyerReviews, (state, { reviews }) => ({
    ...state,
    buyerReviews: reviews
  })),
  on(ReviewsStateActions.setSellerReviews, (state, { reviews }) => ({
    ...state,
    sellerReviews: reviews
  })),
  on(ReviewsStateActions.upsertReview, (state, { review }) => ({
    ...state,
    buyerReviews: upsertById(state.buyerReviews, review),
    sellerReviews: state.sellerReviews.some((item) => item.id === review.id)
      ? upsertById(state.sellerReviews, review)
      : state.sellerReviews,
    productReviews: {
      ...state.productReviews,
      [review.productId]: upsertById(state.productReviews[review.productId] ?? [], review)
    }
  })),
  on(ReviewsStateActions.removeReview, (state, { reviewId }) => {
    const nextProductReviews = Object.entries(state.productReviews).reduce<Record<number, typeof state.buyerReviews>>(
      (result, [productId, reviews]) => {
        result[Number(productId)] = reviews.filter((review) => review.id !== reviewId);
        return result;
      },
      {}
    );

    return {
      ...state,
      buyerReviews: state.buyerReviews.filter((review) => review.id !== reviewId),
      sellerReviews: state.sellerReviews.filter((review) => review.id !== reviewId),
      productReviews: nextProductReviews
    };
  }),
  on(ReviewsStateActions.setAverageRating, (state, { productId, averageRating }) => ({
    ...state,
    averageRatings: {
      ...state.averageRatings,
      [productId]: averageRating
    }
  })),
  on(AuthStateActions.resetSession, () => initialReviewsState)
);

export function reviewsReducer(state: ReviewsState | undefined, action: Action): ReviewsState {
  return reviewsReducerInternal(state, action);
}

const uiFeedbackReducerInternal = createReducer(
  initialUiFeedbackState,
  on(UiFeedbackStateActions.addMessage, (state, { message }) => ({
    ...state,
    messages: [...state.messages, message]
  })),
  on(UiFeedbackStateActions.dismissMessage, (state, { id }) => ({
    ...state,
    messages: state.messages.filter((message) => message.id !== id)
  })),
  on(AuthStateActions.resetSession, () => initialUiFeedbackState)
);

export function uiFeedbackReducer(state: UiFeedbackState | undefined, action: Action): UiFeedbackState {
  return uiFeedbackReducerInternal(state, action);
}

export const appReducers: ActionReducerMap<AppState> = {
  [AUTH_FEATURE_KEY]: authReducer,
  [CART_FEATURE_KEY]: cartReducer,
  [FAVORITES_FEATURE_KEY]: favoritesReducer,
  [PRODUCTS_FEATURE_KEY]: productsReducer,
  [ORDERS_FEATURE_KEY]: ordersReducer,
  [NOTIFICATIONS_FEATURE_KEY]: notificationsReducer,
  [REVIEWS_FEATURE_KEY]: reviewsReducer,
  [UI_FEEDBACK_FEATURE_KEY]: uiFeedbackReducer
};
