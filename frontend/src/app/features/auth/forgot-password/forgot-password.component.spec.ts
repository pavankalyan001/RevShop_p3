import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['forgotPassword', 'resetPassword']);
    component = new ForgotPasswordComponent(new FormBuilder(), authService);
    component.ngOnInit();
  });

  it('marks email as touched when requesting a reset token with an invalid email', () => {
    component.requestResetToken();

    expect(component.resetForm.get('email')?.touched).toBeTrue();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('requests a reset token and shows the success message', () => {
    component.resetForm.patchValue({ email: 'buyer@example.com' });
    authService.forgotPassword.and.returnValue(of('Token sent'));

    component.requestResetToken();

    expect(authService.forgotPassword).toHaveBeenCalledWith({ email: 'buyer@example.com' });
    expect(component.message).toBe('Token sent');
    expect(component.error).toBe('');
  });

  it('shows a backend reset-token error message', () => {
    component.resetForm.patchValue({ email: 'buyer@example.com' });
    authService.forgotPassword.and.returnValue(throwError(() => ({ error: { message: 'User not found' } })));

    component.requestResetToken();

    expect(component.error).toBe('User not found');
    expect(component.message).toBe('');
  });

  it('marks all fields as touched when resetPassword is submitted with an invalid form', () => {
    component.resetPassword();

    expect(component.resetForm.get('token')?.touched).toBeTrue();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('shows an error when passwords do not match', () => {
    component.resetForm.setValue({
      email: 'buyer@example.com',
      token: '123456',
      newPassword: 'secret123',
      confirmPassword: 'different123'
    });

    component.resetPassword();

    expect(component.error).toBe('Passwords do not match.');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('resets the password when the form is valid', () => {
    component.resetForm.setValue({
      email: 'buyer@example.com',
      token: '123456',
      newPassword: 'secret123',
      confirmPassword: 'secret123'
    });
    authService.resetPassword.and.returnValue(of('Password updated'));

    component.resetPassword();

    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      token: '123456',
      newPassword: 'secret123'
    });
    expect(component.message).toBe('Password updated');
    expect(component.error).toBe('');
  });

  it('shows the fallback error when resetPassword fails without a structured payload', () => {
    component.resetForm.setValue({
      email: 'buyer@example.com',
      token: '123456',
      newPassword: 'secret123',
      confirmPassword: 'secret123'
    });
    authService.resetPassword.and.returnValue(throwError(() => ({ message: '' })));

    component.resetPassword();

    expect(component.error).toBe('Something went wrong. Please try again.');
    expect(component.message).toBe('');
  });
});
