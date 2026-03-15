import { HttpClient } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoritesStateActions } from '../store/app-state.actions';
import { AppState } from '../store/app-state.models';
import { selectFavorites, selectFavoritesLoaded } from '../store/app-state.selectors';

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
    readonly favorites$: Observable<Favorite[]>;
    private readonly favoritesState: Signal<Favorite[]>;
    private readonly favoritesLoadedState: Signal<boolean>;

    constructor(private http: HttpClient, private store: Store<AppState>) {
        this.favorites$ = this.store.select(selectFavorites);
        this.favoritesState = this.store.selectSignal(selectFavorites);
        this.favoritesLoadedState = this.store.selectSignal(selectFavoritesLoaded);
    }

    addFavorite(_buyerId: number, productId: number): Observable<Favorite> {
        return this.http.post<any>(`${this.API}/${productId}`, {}).pipe(
            map((favorite) => this.normalizeFavorite(favorite)),
            tap((favorite) => this.store.dispatch(FavoritesStateActions.addFavorite({ favorite })))
        );
    }

    removeFavorite(_buyerId: number, productId: number): Observable<string> {
        return this.http.delete(`${this.API}/${productId}`, { responseType: 'text' }).pipe(
            tap(() => this.store.dispatch(FavoritesStateActions.removeFavorite({ productId })))
        );
    }

    getFavoritesByBuyer(_buyerId: number): Observable<Favorite[]> {
        return this.http.get<any[]>(this.API).pipe(
            map((favorites) => favorites.map((favorite) => this.normalizeFavorite(favorite))),
            tap((favorites) => this.store.dispatch(FavoritesStateActions.setFavorites({ favorites })))
        );
    }

    isFavorite(_buyerId: number, productId: number): Observable<{ isFavorite: boolean }> {
        if (this.favoritesLoadedState()) {
            return of({ isFavorite: this.favoritesState().some((favorite) => favorite.productId === productId) });
        }

        return this.getFavoritesByBuyer(_buyerId).pipe(
            map((favorites) => ({
                isFavorite: favorites.some((favorite) => favorite.productId === productId)
            }))
        );
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
