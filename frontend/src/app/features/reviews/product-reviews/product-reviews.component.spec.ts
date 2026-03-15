import { BehaviorSubject, of } from 'rxjs';
import { ProductReviewsComponent } from './product-reviews.component';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService, User } from '../../../core/services/auth.service';

describe('ProductReviewsComponent', () => {
  let component: ProductReviewsComponent;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };

  beforeEach(() => {
    reviewService = jasmine.createSpyObj<ReviewService>('ReviewService', [
      'getReviewsByProduct',
      'getAverageRating',
      'addReview',
      'deleteReview'
    ]);
    authService = Object.assign(
      {} as jasmine.SpyObj<AuthService>,
      { currentUser$: new BehaviorSubject<User | null>({ id: 5, username: 'buyer', role: 'BUYER' }) }
    );
    reviewService.getReviewsByProduct.and.returnValue(of([]));
    reviewService.getAverageRating.and.returnValue(of({ averageRating: 4.5 }));
    reviewService.addReview.and.returnValue(of({
      id: 1,
      userId: 5,
      productId: 3,
      buyer: { id: 5, name: 'Buyer' },
      product: { id: 3, name: 'Phone' },
      rating: 5,
      comment: 'Great',
      createdAt: '2024-01-01'
    }));
    reviewService.deleteReview.and.returnValue(of('deleted'));

    component = new ProductReviewsComponent(reviewService, authService);
    component.productId = 3;
  });

  it('loads reviews and average rating on init', () => {
    component.ngOnInit();

    expect(reviewService.getReviewsByProduct).toHaveBeenCalledWith(3);
    expect(reviewService.getAverageRating).toHaveBeenCalledWith(3);
    expect(component.buyerId).toBe(5);
    expect(component.averageRating).toBe(4.5);
  });

  it('does not submit a review without an orderId', () => {
    component.submitReview();

    expect(component.errorMessage).toBe('Please submit reviews from the Orders page after purchase.');
    expect(reviewService.addReview).not.toHaveBeenCalled();
  });

  it('submits a review successfully and resets the form state', () => {
    component.newReview = {
      buyerId: 0,
      productId: 0,
      orderId: 9,
      rating: 5,
      comment: 'Great'
    };

    component.submitReview();

    expect(reviewService.addReview).toHaveBeenCalled();
    expect(component.successMessage).toBe('Review submitted successfully!');
    expect(component.showForm).toBeFalse();
    expect(component.newReview.comment).toBe('');
  });

  it('reloads data after deleting a review with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteReview(8);

    expect(reviewService.deleteReview).toHaveBeenCalledWith(8);
    expect(reviewService.getReviewsByProduct).toHaveBeenCalledWith(3);
    expect(reviewService.getAverageRating).toHaveBeenCalledWith(3);
  });
});
