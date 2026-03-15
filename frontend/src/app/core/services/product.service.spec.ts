import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { ProductService } from './product.service';
import { appReducers } from '../store/app-state.reducer';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, StoreModule.forRoot(appReducers)]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a product with a normalized seller request payload', () => {
    let savedProductName = '';
    service.addProduct({
      name: 'Phone',
      description: 'Smart phone',
      price: 90,
      mrp: 100,
      category: 3,
      quantity: 4,
      sellerId: 7,
      discountPercentage: 0,
      stockThreshold: 5
    }).subscribe(product => {
      savedProductName = product.name;
      expect(product.category).toBe(3);
      expect(product.discountPercentage).toBe(10);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/seller/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Phone',
      description: 'Smart phone',
      price: 90,
      mrp: 100,
      quantity: 4,
      imageUrl: '',
      categoryId: 3
    });

    request.flush({
      id: 11,
      name: 'Phone',
      description: 'Smart phone',
      price: 90,
      mrp: 100,
      quantity: 4,
      categoryId: 3,
      sellerId: 7
    });

    expect(savedProductName).toBe('Phone');
  });

  it('extracts products from wrapped API responses', () => {
    let productsLength = 0;
    service.getAllProducts().subscribe(products => {
      productsLength = products.length;
      expect(products[0].categoryName).toBe('Electronics');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/products');
    request.flush({
      products: [
        {
          id: 1,
          name: 'Laptop',
          description: 'Thin laptop',
          price: 900,
          mrp: 1000,
          quantity: 8,
          category: { id: 4, name: 'Electronics' },
          seller: { id: 10 }
        }
      ]
    });

    expect(productsLength).toBe(1);
  });

  it('falls back to the base product endpoint when details lookup fails', () => {
    let productId = 0;
    service.getProductDetails(3).subscribe(product => {
      productId = product.id ?? 0;
    });

    const detailsRequest = httpMock.expectOne('http://localhost:8080/api/products/details/3');
    detailsRequest.flush('Not found', { status: 404, statusText: 'Not Found' });

    const fallbackRequest = httpMock.expectOne('http://localhost:8080/api/products/3');
    fallbackRequest.flush({
      id: 3,
      name: 'Headphones',
      description: 'Noise cancelling',
      price: 120,
      mrp: 150,
      quantity: 5,
      category: 2,
      sellerId: 8
    });

    expect(productId).toBe(3);
  });

  it('updates a product using the seller endpoint', () => {
    service.updateProduct(7, {
      id: 7,
      name: 'Camera',
      description: 'Mirrorless camera',
      price: 450,
      mrp: 500,
      category: 1,
      quantity: 3,
      sellerId: 2,
      active: false,
      discountPercentage: 0,
      stockThreshold: 2
    }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/seller/products/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.active).toBeFalse();
    request.flush({
      id: 7,
      name: 'Camera',
      description: 'Mirrorless camera',
      price: 450,
      mrp: 500,
      quantity: 3,
      categoryId: 1,
      sellerId: 2,
      active: false
    });
  });
});
