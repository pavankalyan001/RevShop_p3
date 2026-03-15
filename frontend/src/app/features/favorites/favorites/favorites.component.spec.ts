import { BehaviorSubject, of, throwError } from 'rxjs';
import { FavoritesComponent } from './favorites.component';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthService, User } from '../../../core/services/auth.service';

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };

  beforeEach(() => {
    favoriteService = jasmine.createSpyObj<FavoriteService>('FavoriteService', ['getFavoritesByBuyer', 'removeFavorite']);
    authService = Object.assign(
      {} as jasmine.SpyObj<AuthService>,
      { currentUser$: new BehaviorSubject<User | null>({ id: 5, username: 'buyer', role: 'BUYER' }) }
    );
    favoriteService.getFavoritesByBuyer.and.returnValue(of([
      { product: { id: 8 }, productName: 'Laptop' }
    ] as any));
    favoriteService.removeFavorite.and.returnValue(of('removed'));

    component = new FavoritesComponent(favoriteService, authService);
  });

  it('loads the current buyer favorites on init', () => {
    component.ngOnInit();

    expect(favoriteService.getFavoritesByBuyer).toHaveBeenCalledWith(5);
    expect(component.favorites.length).toBe(1);
  });

  it('shows a loading error when favorites fail to load', () => {
    favoriteService.getFavoritesByBuyer.and.returnValue(throwError(() => new Error('failed')));

    component.loadFavorites();

    expect(component.errorMessage).toBe('Failed to load favorites');
  });

  it('removes a favorite locally after a successful delete', () => {
    component.favorites = [{ product: { id: 8 } } as any, { product: { id: 9 } } as any];
    component.buyerId = 5;

    component.removeFavorite(8);

    expect(component.favorites.length).toBe(1);
    expect(component.favorites[0].product.id).toBe(9);
  });
});
