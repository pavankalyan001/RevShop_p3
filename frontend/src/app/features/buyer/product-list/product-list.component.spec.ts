import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { UiFeedbackService } from '../../../core/services/ui-feedback.service';

describe('Buyer ProductListComponent', () => {
  let component: ProductListComponent;
  let productService: jasmine.SpyObj<ProductService>;
  let cartService: jasmine.SpyObj<CartService>;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let orderService: jasmine.SpyObj<OrderService>;
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };

  beforeEach(() => {
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['getAllProducts']);
    cartService = jasmine.createSpyObj<CartService>('CartService', ['getCart', 'addToCart', 'removeFromCart', 'updateCartItemQuantity'], {
      cart$: of({
        cartId: 1,
        items: [{
          cartItemId: 1,
          productId: 1,
          productName: 'Laptop',
          productPrice: 100,
          price: 100,
          quantity: 2,
          availableStock: 5,
          subtotal: 200
        }],
        totalPrice: 200,
        totalItems: 2
      })
    });
    favoriteService = jasmine.createSpyObj<FavoriteService>('FavoriteService', ['getFavoritesByBuyer', 'addFavorite', 'removeFavorite']);
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getOrdersByBuyer']);
    uiFeedbackService = jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['success', 'error']);
    authService = Object.assign(
      {} as jasmine.SpyObj<AuthService>,
      { currentUser$: new BehaviorSubject<User | null>({ id: 3, username: 'buyer', role: 'BUYER' }) }
    );

    productService.getAllProducts.and.returnValue(of([
      { id: 1, name: 'Laptop', active: true },
      { id: 2, name: 'Camera', active: false },
      { id: 3, name: 'Phone', active: true }
    ] as any));
    cartService.getCart.and.returnValue(of({
      cartId: 1,
      items: [{
        cartItemId: 1,
        productId: 1,
        productName: 'Laptop',
        productPrice: 100,
        price: 100,
        quantity: 2,
        availableStock: 5,
        subtotal: 200
      }],
      totalPrice: 200,
      totalItems: 2
    } as any));
    cartService.addToCart.and.returnValue(of({} as any));
    favoriteService.getFavoritesByBuyer.and.returnValue(of([
      { product: { id: 1 } }
    ] as any));
    favoriteService.addFavorite.and.returnValue(of({} as any));
    favoriteService.removeFavorite.and.returnValue(of('removed'));
    orderService.getOrdersByBuyer.and.returnValue(of([]));

    component = new ProductListComponent(
      productService,
      cartService,
      favoriteService,
      orderService,
      authService,
      uiFeedbackService
    );
  });

  it('loads products, favorites, dashboard data, and cart quantities on init', () => {
    component.ngOnInit();

    expect(productService.getAllProducts).toHaveBeenCalled();
    expect(orderService.getOrdersByBuyer).toHaveBeenCalledWith(3);
    expect(favoriteService.getFavoritesByBuyer).toHaveBeenCalledWith(3);
    expect(component.allProducts.length).toBe(2);
    expect(component.favoritesMap[1]).toBeTrue();
    expect(component.cartQuantities[1]).toBe(2);
  });

  it('adds a product to cart and reports success', () => {
    component.userId = 3;

    component.addToCart({ id: 1, name: 'Laptop' });

    expect(cartService.addToCart).toHaveBeenCalledWith(3, 1, 1);
    expect(uiFeedbackService.success).toHaveBeenCalledWith('Laptop added to cart.');
  });

  it('shows an error toast when addToCart fails', () => {
    component.userId = 3;
    cartService.addToCart.and.returnValue(throwError(() => ({ error: { message: 'Out of stock' } })));

    component.addToCart({ id: 1, name: 'Laptop' });

    expect(uiFeedbackService.error).toHaveBeenCalledWith('Out of stock');
  });

  it('toggles favorites by calling the expected service method', () => {
    component.userId = 3;
    component.favoritesMap[1] = false;

    component.toggleFavorite({ id: 1 });
    component.toggleFavorite({ id: 1 });

    expect(favoriteService.addFavorite).toHaveBeenCalledWith(3, 1);
    expect(favoriteService.removeFavorite).toHaveBeenCalledWith(3, 1);
  });

  it('paginates forward and backward through the product list', () => {
    component.allProducts = new Array(7).fill(null).map((_, index) => ({ id: index + 1 }));
    component.updatePaginatedProducts();

    component.next();
    expect(component.page).toBe(1);

    component.prev();
    expect(component.page).toBe(0);
  });
});
