import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppState } from '../store/app-state.models';
import { ReviewsStateActions } from '../store/app-state.actions';
import { selectBuyerReviews, selectSellerReviews } from '../store/app-state.selectors';

export interface ReviewRequest {
    buyerId?: number;
    productId: number;
    orderId?: number;
    rating: number;
    comment: string;
}

export interface Review {
    id: number;
    userId: number;
    productId: number;
    orderId?: number;
    buyer: {
        id: number;
        name: string;
    };
    product: {
        id: number;
        name: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewService {

    private API = `${environment.apiBaseUrl}/reviews`;
    readonly buyerReviews$: Observable<Review[]>;
    readonly sellerReviews$: Observable<Review[]>;

    constructor(private http: HttpClient, private store: Store<AppState>) {
        this.buyerReviews$ = this.store.select(selectBuyerReviews);
        this.sellerReviews$ = this.store.select(selectSellerReviews);
    }

    addReview(review: ReviewRequest): Observable<Review> {
        return this.http.post<any>(this.API, {
            productId: review.productId,
            orderId: review.orderId,
            rating: review.rating,
            comment: review.comment
        }).pipe(
            map((saved) => this.normalizeReview(saved)),
            tap((savedReview) => this.store.dispatch(ReviewsStateActions.upsertReview({ review: savedReview })))
        );
    }

    getReviewsByProduct(productId: number): Observable<Review[]> {
        return this.http.get<any>(`${this.API}/product/${productId}`).pipe(
            map((response) => (Array.isArray(response) ? response : response?.reviews || [])),
            map((reviews) => reviews.map((review: any) => this.normalizeReview(review))),
            tap((reviews) => this.store.dispatch(ReviewsStateActions.setProductReviews({ productId, reviews })))
        );
    }

    getReviewsBySeller(sellerId: number): Observable<Review[]> {
        return this.http.get<any[]>(`${this.API}/seller/${sellerId}`).pipe(
            map((reviews) => reviews.map((review) => this.normalizeReview(review))),
            tap((reviews) => this.store.dispatch(ReviewsStateActions.setSellerReviews({ reviews }))),
            catchError(() => of([]))
        );
    }

    getReviewsByBuyer(_buyerId: number): Observable<Review[]> {
        return this.http.get<any[]>(`${this.API}/my`).pipe(
            map((reviews) => reviews.map((review) => this.normalizeReview(review))),
            tap((reviews) => this.store.dispatch(ReviewsStateActions.setBuyerReviews({ reviews })))
        );
    }

    getAverageRating(productId: number): Observable<{ averageRating: number }> {
        return this.http.get<{ averageRating: number }>(`${this.API}/product/${productId}/average`).pipe(
            tap((response) => this.store.dispatch(
                ReviewsStateActions.setAverageRating({
                    productId,
                    averageRating: response.averageRating
                })
            ))
        );
    }

    deleteReview(reviewId: number): Observable<string> {
        return this.http.delete(`${this.API}/${reviewId}`, { responseType: 'text' }).pipe(
            tap(() => this.store.dispatch(ReviewsStateActions.removeReview({ reviewId })))
        );
    }

    private normalizeReview(review: any): Review {
        const userId = Number(review?.userId ?? review?.buyer?.id ?? 0);
        const productId = Number(review?.productId ?? review?.product?.id ?? 0);

        return {
            id: Number(review?.id ?? 0),
            userId,
            productId,
            orderId: Number(review?.orderId ?? 0) || undefined,
            buyer: {
                id: userId,
                name: review?.buyer?.name ?? `User ${userId}`
            },
            product: {
                id: productId,
                name: review?.product?.name ?? `Product #${productId}`
            },
            rating: Number(review?.rating ?? 0),
            comment: review?.comment ?? '',
            createdAt: review?.createdAt ?? new Date().toISOString()
        };
    }
}
