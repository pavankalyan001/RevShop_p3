import { of, throwError } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../../../core/services/product.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let productService: jasmine.SpyObj<ProductService>;
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService>;

  beforeEach(() => {
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['deleteProduct']);
    uiFeedbackService = jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['success', 'error']);
    component = new ProductListComponent(productService, uiFeedbackService);
  });

  it('emits the product selected for editing', () => {
    const editSpy = jasmine.createSpy('edit');
    component.editProduct.subscribe(editSpy);
    const product = { id: 1, name: 'Laptop' } as any;

    component.edit(product);

    expect(editSpy).toHaveBeenCalledWith(product);
  });

  it('does not delete when the user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.delete(7);

    expect(productService.deleteProduct).not.toHaveBeenCalled();
  });

  it('deletes a product and emits a refresh event', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const deletedSpy = jasmine.createSpy('deleted');
    component.productDeleted.subscribe(deletedSpy);
    productService.deleteProduct.and.returnValue(of({}));

    component.delete(7);

    expect(productService.deleteProduct).toHaveBeenCalledWith(7);
    expect(component.listMessage).toBe('Product deleted successfully.');
    expect(uiFeedbackService.success).toHaveBeenCalled();
    expect(deletedSpy).toHaveBeenCalled();
  });

  it('shows a UI error when delete fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    productService.deleteProduct.and.returnValue(throwError(() => ({ error: { message: 'Delete failed' } })));

    component.delete(7);

    expect(component.listMessage).toBe('Delete failed');
    expect(uiFeedbackService.error).toHaveBeenCalledWith('Delete failed');
  });
});
