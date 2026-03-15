import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProductDetailsComponent } from './product-details.component';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { UiFeedbackService } from '../../../core/services/ui-feedback.service';

describe('ProductDetailsComponent', () => {
  let component: ProductDetailsComponent;
  let productService: jasmine.SpyObj<ProductService>;
  let cartService: jasmine.SpyObj<CartService>;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService>;
  let authService: AuthService & { currentUser$: BehaviorSubject<User | null> };
  let currentUser: User | null;

  beforeEach(() => {
    currentUser = { id: 4, username: 'buyer', role: 'BUYER' };
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['getProductDetails']);
    cartService = jasmine.createSpyObj<CartService>('CartService', ['addToCart', 'getCart']);
    favoriteService = jasmine.createSpyObj<FavoriteService>('FavoriteService', ['isFavorite', 'addFavorite', 'removeFavorite']);
    uiFeedbackService = jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['success', 'error', 'info']);
    authService = {
      currentUser$: new BehaviorSubject<User | null>(currentUser),
      get currentUser() {
        return currentUser;
      }
    } as AuthService & { currentUser$: BehaviorSubject<User | null> };

    productService.getProductDetails.and.returnValue(of({ id: 8, name: 'Laptop' } as any));
    favoriteService.isFavorite.and.returnValue(of({ isFavorite: true }));
    cartService.addToCart.and.returnValue(of({} as any));
    cartService.getCart.and.returnValue(of({} as any));
    favoriteService.addFavorite.and.returnValue(of({} as any));
    favoriteService.removeFavorite.and.returnValue(of('removed'));

    component = new ProductDetailsComponent(
      {
        snapshot: { paramMap: convertToParamMap({ id: '8' }) }
      } as ActivatedRoute,
      productService,
      cartService,
      authService,
      favoriteService,
      uiFeedbackService
    );
  });

  it('loads the product and favorite status on init', () => {
    component.ngOnInit();

    expect(productService.getProductDetails).toHaveBeenCalledWith(8);
    expect(favoriteService.isFavorite).toHaveBeenCalledWith(4, 8);
    expect(component.isFavorite).toBeTrue();
  });

  it('asks the user to log in before toggling a favorite', () => {
    currentUser = null;
    component.userId = undefined;
    component.product = { id: 8, name: 'Laptop' };

    component.toggleFavorite();

    expect(uiFeedbackService.info).toHaveBeenCalledWith('Please log in first to manage favorites.');
  });

  it('adds and removes favorites', () => {
    component.product = { id: 8, name: 'Laptop' };
    component.userId = 4;
    component.isFavorite = false;

    component.toggleFavorite();
    expect(favoriteService.addFavorite).toHaveBeenCalledWith(4, 8);

    component.isFavorite = true;
    component.toggleFavorite();
    expect(favoriteService.removeFavorite).toHaveBeenCalledWith(4, 8);
  });

  it('adds the product to cart and shows success feedback', () => {
    component.product = { id: 8, name: 'Laptop' };

    component.addToCart();

    expect(cartService.addToCart).toHaveBeenCalledWith(4, 8, 1);
    expect(uiFeedbackService.success).toHaveBeenCalledWith('Laptop added to cart.');
  });

  it('shows an error toast when addToCart fails', () => {
    component.product = { id: 8, name: 'Laptop' };
    cartService.addToCart.and.returnValue(throwError(() => ({ error: { message: 'Out of stock' } })));

    component.addToCart();

    expect(uiFeedbackService.error).toHaveBeenCalledWith('Out of stock');
  });
});
