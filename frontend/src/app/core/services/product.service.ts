import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Product } from '../../features/seller-product/models/product.model';
import { Observable, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductsStateActions } from '../store/app-state.actions';
import { AppState } from '../store/app-state.models';
import {
  selectAllProducts,
  selectSearchResults,
  selectSelectedProduct,
  selectSellerProducts
} from '../store/app-state.selectors';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = `${environment.apiBaseUrl}/products`;
  private sellerUrl = `${environment.apiBaseUrl}/seller/products`;
  readonly allProducts$: Observable<Product[]>;
  readonly sellerProducts$: Observable<Product[]>;
  readonly searchResults$: Observable<Product[]>;
  readonly selectedProduct$: Observable<Product | null>;

  constructor(private http: HttpClient, private store: Store<AppState>) {
    this.allProducts$ = this.store.select(selectAllProducts);
    this.sellerProducts$ = this.store.select(selectSellerProducts);
    this.searchResults$ = this.store.select(selectSearchResults);
    this.selectedProduct$ = this.store.select(selectSelectedProduct);
  }

  // ===== Kavya's Seller Methods =====

  addProduct(product: Product): Observable<Product> {
    return this.http.post<any>(this.sellerUrl, this.toProductRequest(product))
      .pipe(
        map((saved) => this.normalizeProduct(saved)),
        tap((savedProduct) => this.store.dispatch(ProductsStateActions.upsertProduct({ product: savedProduct })))
      );
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<any>(`${this.sellerUrl}/${id}`, this.toProductUpdateRequest(product))
      .pipe(
        map((saved) => this.normalizeProduct(saved)),
        tap((savedProduct) => this.store.dispatch(ProductsStateActions.upsertProduct({ product: savedProduct })))
      );
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.sellerUrl}/${id}`).pipe(
      tap(() => this.store.dispatch(ProductsStateActions.removeProduct({ id })))
    );
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map((response) => this.extractProducts(response)),
      map((products) => products.map((p) => this.normalizeProduct(p))),
      tap((products) => this.store.dispatch(ProductsStateActions.setAllProducts({ products })))
    );
  }

  getSellerProducts(_sellerId?: number): Observable<Product[]> {
    return this.http.get<any[]>(this.sellerUrl).pipe(
      map((products) => products.map((p) => this.normalizeProduct(p))),
      tap((products) => this.store.dispatch(ProductsStateActions.setSellerProducts({ products })))
    );
  }

  setThreshold(id: number, threshold: number) {
    return this.http.put(
      `${this.sellerUrl}/${id}/threshold`,
      { threshold }
    );
  }

  private normalizeProduct(product: any): Product {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      mrp: product.mrp,
      discountPercentage: product.discountPercentage ?? this.calculateDiscount(product.mrp, product.price),
      category: product.categoryId ?? product.category?.id ?? product.category ?? 1,
      categoryName: product.categoryName ?? product.category?.name,
      quantity: product.quantity,
      sellerId: product.sellerId ?? product.seller?.id ?? 0,
      active: product.active ?? true,
      stockThreshold: product.stockThreshold ?? 5
    };
  }

  // ===== Jatin's Buyer Methods =====

  getProductsByCategory(categoryId: number, page: number = 0, size: number = 5) {
    return this.http.get<any>(
      `${this.baseUrl}/category/${categoryId}?page=${page}&size=${size}`
    ).pipe(
      map((response) => {
        const products = this.extractProducts(response).map((p) => this.normalizeProduct(p));
        return { ...response, products };
      })
    );
  }

  searchProducts(keyword: string) {
    return this.http.get<any[]>(`${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}`)
      .pipe(
        map((products) => products.map((p) => this.normalizeProduct(p))),
        tap((products) => this.store.dispatch(ProductsStateActions.setSearchResults({ products })))
      );
  }

  getProductDetails(id: number) {
    return this.http.get<any>(`${this.baseUrl}/details/${id}`).pipe(
      catchError(() => this.http.get<any>(`${this.baseUrl}/${id}`)),
      map((product) => this.normalizeProduct(product)),
      tap((product) => this.store.dispatch(ProductsStateActions.setSelectedProduct({ product })))
    );
  }

  private toProductRequest(product: Product): any {
    return {
      name: product.name,
      description: product.description,
      price: Number(product.price),
      mrp: Number(product.mrp),
      quantity: Number(product.quantity),
      imageUrl: (product as any).imageUrl || '',
      categoryId: this.extractCategoryId(product)
    };
  }

  private toProductUpdateRequest(product: Product): any {
    return {
      ...this.toProductRequest(product),
      active: product.active ?? true
    };
  }

  private extractCategoryId(product: Product): number {
    const categoryValue = (product as any).categoryId ?? product.category;
    const categoryId = Number(categoryValue);
    return Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 1;
  }

  private extractProducts(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.products)) {
      return response.products;
    }
    if (Array.isArray(response?.content)) {
      return response.content;
    }
    return [];
  }

  private calculateDiscount(mrp?: number, price?: number): number {
    if (!mrp || !price || mrp <= 0 || mrp < price) {
      return 0;
    }
    return +(((mrp - price) / mrp) * 100).toFixed(2);
  }
}
