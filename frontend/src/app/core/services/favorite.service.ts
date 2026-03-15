import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Favorite {
    id: number;
    productId: number;
    productName: string;
    productPrice: number;
    productImage?: string;
    product: {
        id: number;
        name: string;
        price: number;
        imageUrl?: string;
        description?: string;
        categoryName?: string;
        category?: any;
    };
    addedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class FavoriteService {

    private API = `${environment.apiBaseUrl}/favorites`;

    constructor(private http: HttpClient) { }

    addFavorite(_buyerId: number, productId: number): Observable<Favorite> {
        return this.http.post<any>(`${this.API}/${productId}`, {}).pipe(
            map((favorite) => this.normalizeFavorite(favorite))
        );
    }

    removeFavorite(_buyerId: number, productId: number): Observable<string> {
        return this.http.delete(`${this.API}/${productId}`, { responseType: 'text' });
    }

    getFavoritesByBuyer(_buyerId: number): Observable<Favorite[]> {
        return this.http.get<any[]>(this.API).pipe(
            map((favorites) => favorites.map((favorite) => this.normalizeFavorite(favorite)))
        );
    }

    isFavorite(_buyerId: number, productId: number): Observable<{ isFavorite: boolean }> {
        return this.http.get<{ isFavorite: boolean }>(`${this.API}/${productId}/check`);
    }

    private normalizeFavorite(favorite: any): Favorite {
        const productId = Number(favorite?.productId ?? favorite?.product?.id ?? 0);
        const productName = favorite?.productName ?? favorite?.product?.name ?? '';
        const productPrice = Number(favorite?.productPrice ?? favorite?.product?.price ?? 0);
        const productImage = favorite?.productImage ?? favorite?.product?.imageUrl ?? '';

        return {
            id: Number(favorite?.id ?? 0),
            productId,
            productName,
            productPrice,
            productImage,
            product: {
                id: productId,
                name: productName,
                price: productPrice,
                imageUrl: productImage,
                description: favorite?.productDescription ?? '',
                categoryName: favorite?.categoryName ?? '',
                category: favorite?.category ?? null
            },
            addedAt: favorite?.addedAt ?? new Date().toISOString()
        };
    }
}
