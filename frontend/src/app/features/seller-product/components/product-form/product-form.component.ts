import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../models/product.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';

type ProductField =
  | 'name'
  | 'description'
  | 'category'
  | 'quantity'
  | 'price'
  | 'mrp'
  | 'discountPercentage'
  | 'stockThreshold';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnChanges {

  @Input() product:Product|null=null;         // product to edit, if any
  @Output() onSaved = new EventEmitter<void>(); // notify list after save

  form: Product = this.emptyForm();
  fieldErrors: Partial<Record<ProductField, string>> = {};
  statusMessage = '';
  statusTone: 'success' | 'error' | 'info' = 'info';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private uiFeedbackService: UiFeedbackService
  ) {}

  ngOnChanges() {
    // Copy input product to local form or reset if adding
    this.form = this.product ? { ...this.product } : this.emptyForm();
    this.fieldErrors = {};
    this.statusMessage = '';
  }

  save() {
     if (!this.authService.currentUser) {
       this.setStatus('error', 'Please login first to manage products.');
       this.uiFeedbackService.error('Please login first to manage products.');
       return;
     }

     if (!this.validateForm()) {
       this.setStatus('error', 'Fix the highlighted fields before saving.');
       return;
     }

     // Ensure sellerId is always current user
     this.form.sellerId = this.authService.currentUser.id;

     if (this.form.id ){
       // Update existing product
       this.productService.updateProduct(this.form.id, this.form)
         .subscribe({
           next: () => this.onSaveSuccess('Product updated successfully.'),
           error: (err) => this.onSaveError(err)
         });
     } else {
       // Add new product
       this.productService.addProduct(this.form)
       .subscribe({
         next: () => this.onSaveSuccess('Product added successfully.'),
         error: (err) => this.onSaveError(err)
       });
     }
   }

  private onSaveSuccess(message: string) {
     this.fieldErrors = {};
     this.setStatus('success', message);
     this.uiFeedbackService.success(message);
     this.onSaved.emit();
     this.form = this.emptyForm();
   }

  private onSaveError(err: any) {
    const message = err?.error?.message || err?.error || 'Failed to save product';
    this.setStatus('error', message);
    this.uiFeedbackService.error(message);
    console.error('Product save failed', err);
  }

  clearFieldError(field: ProductField): void {
    delete this.fieldErrors[field];
    if (this.statusTone === 'error') {
      this.statusMessage = '';
    }
  }

  private validateForm(): boolean {
    const errors: Partial<Record<ProductField, string>> = {};
    const name = this.form.name?.trim();
    const description = this.form.description?.trim();
    const category = Number(this.form.category);
    const quantity = Number(this.form.quantity);
    const price = Number(this.form.price);
    const mrp = Number(this.form.mrp);
    const discountPercentage = Number(this.form.discountPercentage ?? 0);
    const stockThreshold = Number(this.form.stockThreshold);

    if (!name) {
      errors.name = 'Product name is required.';
    }

    if (!description) {
      errors.description = 'Description is required.';
    }

    if (!Number.isFinite(category) || category <= 0) {
      errors.category = 'Category ID must be greater than 0.';
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      errors.quantity = 'Quantity cannot be negative.';
    }

    if (!Number.isFinite(price) || price <= 0) {
      errors.price = 'Price must be greater than 0.';
    }

    if (!Number.isFinite(mrp) || mrp <= 0) {
      errors.mrp = 'MRP must be greater than 0.';
    } else if (Number.isFinite(price) && price > 0 && mrp < price) {
      errors.mrp = 'MRP must be greater than or equal to price.';
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      errors.discountPercentage = 'Discount must be between 0 and 100.';
    }

    if (!Number.isFinite(stockThreshold) || stockThreshold < 0) {
      errors.stockThreshold = 'Stock threshold cannot be negative.';
    }

    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  private setStatus(tone: 'success' | 'error' | 'info', message: string): void {
    this.statusTone = tone;
    this.statusMessage = message;
  }

  private emptyForm(): Product {
    return {
      id: 0, // ensure 0 or undefined for new product
      name: '',
      description: '',
      price: 0,
      mrp: 0,
      category: 1,
      quantity: 0,
      sellerId: 0,
      discountPercentage: 0,
      stockThreshold: 5
    };
  }
}
