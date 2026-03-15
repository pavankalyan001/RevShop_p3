import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

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

    constructor(private http: HttpClient) { }

    addReview(review: ReviewRequest): Observable<Review> {
        return this.http.post<any>(this.API, {
            productId: review.productId,
            orderId: review.orderId,
            rating: review.rating,
            comment: review.comment
        }).pipe(
            map((saved) => this.normalizeReview(saved))
        );
    }

    getReviewsByProduct(productId: number): Observable<Review[]> {
        return this.http.get<any>(`${this.API}/product/${productId}`).pipe(
            map((response) => (Array.isArray(response) ? response : response?.reviews || [])),
            map((reviews) => reviews.map((review: any) => this.normalizeReview(review)))
        );
    }

    getReviewsBySeller(sellerId: number): Observable<Review[]> {
        return this.http.get<any[]>(`${this.API}/seller/${sellerId}`).pipe(
            map((reviews) => reviews.map((review) => this.normalizeReview(review))),
            catchError(() => of([]))
        );
    }

    getReviewsByBuyer(_buyerId: number): Observable<Review[]> {
        return this.http.get<any[]>(`${this.API}/my`).pipe(
            map((reviews) => reviews.map((review) => this.normalizeReview(review)))
        );
    }

    getAverageRating(productId: number): Observable<{ averageRating: number }> {
        return this.http.get<{ averageRating: number }>(`${this.API}/product/${productId}/average`);
    }

    deleteReview(reviewId: number): Observable<string> {
        return this.http.delete(`${this.API}/${reviewId}`, { responseType: 'text' });
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
