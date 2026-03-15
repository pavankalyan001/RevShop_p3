import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds a review using the reduced backend payload', () => {
    service.addReview({
      buyerId: 5,
      productId: 3,
      orderId: 9,
      rating: 4,
      comment: 'Nice'
    }).subscribe(review => {
      expect(review.productId).toBe(3);
      expect(review.buyer.name).toBe('Buyer');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/reviews');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      productId: 3,
      orderId: 9,
      rating: 4,
      comment: 'Nice'
    });
    request.flush({
      id: 1,
      buyer: { id: 5, name: 'Buyer' },
      product: { id: 3, name: 'Phone' },
      rating: 4,
      comment: 'Nice',
      createdAt: '2024-01-01'
    });
  });

  it('extracts reviews from wrapped product responses', () => {
    service.getReviewsByProduct(3).subscribe(reviews => {
      expect(reviews.length).toBe(1);
      expect(reviews[0].product.name).toBe('Phone');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/reviews/product/3');
    request.flush({
      reviews: [
        {
          id: 1,
          buyer: { id: 5, name: 'Buyer' },
          product: { id: 3, name: 'Phone' },
          rating: 5,
          comment: 'Great'
        }
      ]
    });
  });

  it('returns an empty array when seller reviews fail to load', () => {
    let reviewsLength = -1;
    service.getReviewsBySeller(9).subscribe(reviews => {
      reviewsLength = reviews.length;
    });

    const request = httpMock.expectOne('http://localhost:8080/api/reviews/seller/9');
    request.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(reviewsLength).toBe(0);
  });
});
