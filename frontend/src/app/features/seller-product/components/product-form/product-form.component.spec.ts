import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import { of, throwError } from 'rxjs';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let productService: jasmine.SpyObj<ProductService>;
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService>;
  let authService: AuthService;
  let currentUser: User | null;

  beforeEach(() => {
    currentUser = { id: 7, username: 'seller', role: 'SELLER' };
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['addProduct', 'updateProduct']);
    uiFeedbackService = jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['success', 'error']);
    authService = {} as AuthService;
    Object.defineProperty(authService, 'currentUser', {
      get: () => currentUser
    });

    component = new ProductFormComponent(productService, authService, uiFeedbackService);
    component.ngOnChanges();
  });

  it('blocks saving when the seller is not authenticated', () => {
    currentUser = null;

    component.save();

    expect(component.statusMessage).toBe('Please login first to manage products.');
    expect(uiFeedbackService.error).toHaveBeenCalled();
    expect(productService.addProduct).not.toHaveBeenCalled();
  });

  it('shows validation errors when required form fields are missing', () => {
    component.form = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      mrp: 0,
      category: 0,
      quantity: -1,
      sellerId: 0,
      discountPercentage: 101,
      stockThreshold: -1
    };

    component.save();

    expect(component.statusMessage).toBe('Fix the highlighted fields before saving.');
    expect(component.fieldErrors.name).toBeDefined();
    expect(component.fieldErrors.discountPercentage).toBeDefined();
  });

  it('adds a product successfully and emits onSaved', () => {
    const savedSpy = jasmine.createSpy('saved');
    component.onSaved.subscribe(savedSpy);
    component.form = {
      id: 0,
      name: 'Laptop',
      description: 'Thin laptop',
      price: 100,
      mrp: 120,
      category: 1,
      quantity: 4,
      sellerId: 0,
      discountPercentage: 0,
      stockThreshold: 3
    };
    productService.addProduct.and.returnValue(of(component.form));

    component.save();

    expect(productService.addProduct).toHaveBeenCalled();
    expect(component.statusMessage).toBe('Product added successfully.');
    expect(uiFeedbackService.success).toHaveBeenCalled();
    expect(savedSpy).toHaveBeenCalled();
    expect(component.form.name).toBe('');
  });

  it('shows the backend error when updating a product fails', () => {
    component.form = {
      id: 3,
      name: 'Laptop',
      description: 'Thin laptop',
      price: 100,
      mrp: 120,
      category: 1,
      quantity: 4,
      sellerId: 0,
      discountPercentage: 0,
      stockThreshold: 3
    };
    productService.updateProduct.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));

    component.save();

    expect(component.statusMessage).toBe('Save failed');
    expect(uiFeedbackService.error).toHaveBeenCalledWith('Save failed');
  });
});
