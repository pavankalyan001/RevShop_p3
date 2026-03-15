import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FavoriteService } from './favorite.service';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(FavoriteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads favorites and normalizes product information', () => {
    service.getFavoritesByBuyer(5).subscribe(favorites => {
      expect(favorites.length).toBe(1);
      expect(favorites[0].product.id).toBe(8);
      expect(favorites[0].product.name).toBe('Laptop');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/favorites');
    request.flush([
      {
        id: 1,
        productId: 8,
        productName: 'Laptop',
        productPrice: 1200
      }
    ]);
  });

  it('adds and removes favorites through the expected endpoints', () => {
    let removed = '';
    service.addFavorite(5, 8).subscribe(favorite => {
      expect(favorite.productId).toBe(8);
    });
    service.removeFavorite(5, 8).subscribe(value => {
      removed = value;
    });

    httpMock.expectOne((request) =>
      request.url === 'http://localhost:8080/api/favorites/8' && request.method === 'POST'
    ).flush({
      id: 1,
      productId: 8,
      productName: 'Laptop',
      productPrice: 1200
    });
    httpMock.expectOne((request) =>
      request.url === 'http://localhost:8080/api/favorites/8' && request.method === 'DELETE'
    ).flush('Removed');

    expect(removed).toBe('Removed');
  });
});
