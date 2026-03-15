import { of } from 'rxjs';
import { ProductSearchComponent } from './product-search.component';
import { ProductService } from '../../../core/services/product.service';

describe('ProductSearchComponent', () => {
  it('searches products and stores the results', () => {
    const productService = jasmine.createSpyObj<ProductService>('ProductService', ['searchProducts']);
    productService.searchProducts.and.returnValue(of([{ id: 1, name: 'Laptop' }] as any));
    const component = new ProductSearchComponent(productService);
    component.keyword = 'laptop';

    component.search();

    expect(productService.searchProducts).toHaveBeenCalledWith('laptop');
    expect(component.results).toEqual([{ id: 1, name: 'Laptop' }] as any);
  });
});
